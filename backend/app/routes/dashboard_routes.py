from typing import List, Dict
from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.db_models import HealthReport, RiskAssessment, Alert, User
from backend.app.models.schemas import DashboardStats, MapLocationPoint, HealthReportOut, AlertOut
from backend.app.core.risk_window import get_active_window_start, get_risk_window_hours

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Statistics"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # ── Historical totals (all-time, unfiltered) ──────────────────────────────
    # These counts deliberately include all records regardless of age so the
    # dashboard retains full historical context.
    total_reports = db.query(HealthReport).count()
    total_alerts = db.query(Alert).count()
    total_users = db.query(User).count()
    pending_alerts = db.query(Alert).filter(Alert.status == "pending").count()
    verified_alerts = db.query(Alert).filter(Alert.status == "verified").count()

    # ── Current-risk counts (active window only) ──────────────────────────────
    # Only risk assessments linked to reports within the active rolling window
    # are counted here.  This ensures the dashboard "current risk" tiles reflect
    # the live situation and NOT stale historical data.
    window_start = get_active_window_start()

    # Active reports count in the rolling window
    active_reports_count = (
        db.query(HealthReport)
        .filter(
            HealthReport.report_date >= window_start,
            HealthReport.archived_at.is_(None)
        )
        .count()
    )

    # Join RiskAssessment → HealthReport to filter by report_date
    active_risk_query = (
        db.query(RiskAssessment)
        .join(HealthReport, RiskAssessment.report_id == HealthReport.id)
        .filter(
            HealthReport.report_date >= window_start,
            HealthReport.archived_at.is_(None),
        )
    )
    low_risk = active_risk_query.filter(RiskAssessment.risk_level == "Low").count()
    med_risk = active_risk_query.filter(RiskAssessment.risk_level == "Medium").count()
    high_risk = active_risk_query.filter(RiskAssessment.risk_level == "High").count()

    # ── Historical disease/location breakdown (all-time) ─────────────────────
    # Charts and analytics purposely use all records for trend visibility.
    disease_rows = (
        db.query(HealthReport.disease, func.count(HealthReport.id))
        .group_by(HealthReport.disease)
        .all()
    )
    disease_counts = {d or "Unspecified": cnt for d, cnt in disease_rows}

    loc_rows = (
        db.query(HealthReport.location_name, func.count(HealthReport.id))
        .group_by(HealthReport.location_name)
        .all()
    )
    location_counts = {l or "Unknown Location": cnt for l, cnt in loc_rows}

    # ── Recent items (always most-recent regardless of window) ────────────────
    recent_reports_db = (
        db.query(HealthReport)
        .order_by(HealthReport.report_date.desc())
        .limit(10)
        .all()
    )
    recent_alerts_db = (
        db.query(Alert)
        .order_by(Alert.created_at.desc())
        .limit(10)
        .all()
    )

    return DashboardStats(
        total_reports=total_reports,
        total_alerts=total_alerts,
        total_users=total_users,
        active_reports_count=active_reports_count,
        pending_alerts=pending_alerts,
        verified_alerts=verified_alerts,
        low_risk_count=low_risk,
        medium_risk_count=med_risk,
        high_risk_count=high_risk,
        recent_reports=[HealthReportOut.model_validate(r) for r in recent_reports_db],
        recent_alerts=[AlertOut.model_validate(a) for a in recent_alerts_db],
        disease_counts=disease_counts,
        location_counts=location_counts
    )


@router.get("/map", response_model=List[MapLocationPoint])
def get_map_data(db: Session = Depends(get_db)):
    # Map shows ALL non-archived reports for full geographic context.
    # Risk level displayed per point reflects the stored risk assessment
    # (computed at submission time within the window that was active then).
    reports = db.query(HealthReport).filter(
        HealthReport.archived_at.is_(None)
    ).all()
    points = []

    for r in reports:
        risk_lvl = r.risk_assessment.risk_level if r.risk_assessment else "Low"
        has_alert = False
        alert_stat = None
        if r.risk_assessment and r.risk_assessment.alerts:
            has_alert = True
            alert_stat = r.risk_assessment.alerts[0].status

        points.append(
            MapLocationPoint(
                id=r.id,
                latitude=r.latitude or 12.9716,
                longitude=r.longitude or 77.5946,
                location_name=r.location_name or "Unknown Location",
                disease=r.disease or "Health Report",
                symptoms=r.symptoms,
                risk_level=risk_lvl,
                cases_count=r.cases_count or 1,
                report_date=r.report_date,
                is_alert=has_alert,
                alert_status=alert_stat
            )
        )
    return points
