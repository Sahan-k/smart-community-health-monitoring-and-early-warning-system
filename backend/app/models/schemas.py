from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
import re


# --- Auth Schemas ---

def validate_indian_mobile(phone: str) -> str:
    """Validate Indian mobile number: 10 digits, starts with 6-9."""
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    if cleaned.startswith('+91'):
        cleaned = cleaned[3:]
    if not re.match(r'^[6-9]\d{9}$', cleaned):
        raise ValueError('Invalid Indian mobile number. Must be 10 digits starting with 6-9.')
    return cleaned


class UserRegister(BaseModel):
    username: str
    phone_number: str
    password: str
    email: str  # required
    role: str   # required: community_member, health_worker, healthcare_professional
    full_name: Optional[str] = None
    preferred_language: str = "en"

    def model_post_init(self, __context):
        if not self.full_name:
            self.full_name = self.username
        self.phone_number = validate_indian_mobile(self.phone_number)
        self.email = self.email.strip().lower()
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', self.email):
            raise ValueError('Invalid email address format.')
        # validate username (alphanumeric, underscores, 3-30 chars)
        if not re.match(r'^[a-zA-Z0-9_]{3,30}$', self.username):
            raise ValueError('Username must be 3-30 characters, letters/digits/underscores only.')
        # validate role
        role_norm = (self.role or '').strip().lower().replace(' ', '_')
        if role_norm in ['administrator', 'admin']:
            raise ValueError('Administrator accounts cannot be created through public registration.')
        if role_norm not in ['community_member', 'health_worker', 'healthcare_professional']:
            raise ValueError('Role must be one of: Community Member, ASHA Worker, or Doctor.')
        self.role = role_norm
        # validate password requirements
        if len(self.password) < 8:
            raise ValueError('Password must be at least 8 characters long.')
        if not re.search(r'[A-Z]', self.password):
            raise ValueError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', self.password):
            raise ValueError('Password must contain at least one lowercase letter.')
        if not re.search(r'\d', self.password):
            raise ValueError('Password must contain at least one digit.')
        if not re.search(r'[^A-Za-z0-9]', self.password):
            raise ValueError('Password must contain at least one special character.')


class UserLogin(BaseModel):
    identifier: str   # username or email
    password: str
    role: Optional[str] = None


class OTPVerifyRequest(BaseModel):
    phone_number: str
    otp: str

    def model_post_init(self, __context):
        self.phone_number = validate_indian_mobile(self.phone_number)


class UserOut(BaseModel):
    id: int
    full_name: str
    username: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    phone_verified: bool = False
    role: str
    preferred_language: Optional[str] = "en"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


# --- Location Schemas ---

class LocationOut(BaseModel):
    id: int
    state: str
    district: str
    taluk: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


# --- Health Report Schemas ---

class HealthReportCreate(BaseModel):
    disease: Optional[str] = "Viral Fever"
    symptoms: str
    cases_count: int = 1
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    taluk: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    source: str = "text"  # "text" or "voice"

    # ML Feature overrides if available
    fever_reports: Optional[int] = 0
    cough_reports: Optional[int] = 0
    diarrhea_reports: Optional[int] = 0
    headache_reports: Optional[int] = 0
    rash_reports: Optional[int] = 0
    respiratory_reports: Optional[int] = 0
    avg_temp_c: Optional[float] = None
    rainfall_mm: Optional[float] = None
    humidity_percent: Optional[float] = None
    water_ph: Optional[float] = None
    turbidity_ntu: Optional[float] = None


class RiskAssessmentOut(BaseModel):
    id: int
    report_id: Optional[int]
    risk_level: str
    confidence: Optional[float]
    model_version: Optional[str]
    assessed_at: Optional[datetime]

    class Config:
        from_attributes = True


class HealthReportOut(BaseModel):
    id: int
    user_id: Optional[int]
    disease: Optional[str]
    symptoms: str
    cases_count: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    location_name: Optional[str]
    state: Optional[str] = None
    district: Optional[str] = None
    taluk: Optional[str] = None
    report_date: Optional[datetime]
    source: Optional[str]
    archived_at: Optional[datetime] = None
    risk_assessment: Optional[RiskAssessmentOut] = None
    email_delivery: Optional[dict] = None

    class Config:
        from_attributes = True


# --- Alert Schemas ---

class AlertOut(BaseModel):
    id: int
    risk_assessment_id: Optional[int]
    title: str
    message: str
    location_name: Optional[str]
    status: str  # "pending", "verified", "rejected", "investigating"
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class AlertReviewCreate(BaseModel):
    decision: str  # "verified", "rejected", "investigate"
    comments: Optional[str] = ""


class AlertReviewOut(BaseModel):
    id: int
    alert_id: Optional[int]
    reviewer_id: Optional[int]
    decision: str
    comments: Optional[str]
    reviewed_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Notification Schemas ---

class NotificationOut(BaseModel):
    id: int
    user_id: Optional[int]
    alert_id: Optional[int]
    title: str
    message: str
    notification_type: Optional[str]
    is_read: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Chat Schemas ---

class ChatMessageCreate(BaseModel):
    message: str
    language: str = "en"


class ChatMessageOut(BaseModel):
    id: int
    user_id: Optional[int]
    user_message: str
    assistant_response: str
    language: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Dashboard & Map Schemas ---

class DashboardStats(BaseModel):
    total_reports: int
    total_alerts: int
    pending_alerts: int
    verified_alerts: int
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    total_users: Optional[int] = 0
    active_reports_count: Optional[int] = 0
    recent_reports: List[HealthReportOut]
    recent_alerts: List[AlertOut]
    disease_counts: dict
    location_counts: dict


class MapLocationPoint(BaseModel):
    id: int
    latitude: float
    longitude: float
    location_name: str
    disease: str
    symptoms: str
    risk_level: str
    cases_count: int
    report_date: datetime
    is_alert: bool
    alert_status: Optional[str] = None


# --- Environmental Data Schema ---

class EnvironmentalData(BaseModel):
    avg_temp_c: float
    rainfall_mm: float
    humidity_percent: float
    water_ph: float
    turbidity_ntu: float
    temp_source: str = "demo_data"
    rainfall_source: str = "demo_data"
    water_ph_source: str = "demo_data"
    turbidity_source: str = "demo_data"


# --- Risk Calculation Schema ---

class TalukRiskOut(BaseModel):
    taluk: str
    district: str
    state: str
    # Active report count within the configured rolling window
    report_count_active: int
    # Backward-compat alias: expose the same value as report_count_7d so any
    # existing frontend code that reads report_count_7d continues to work.
    report_count_7d: Optional[int] = None
    risk_level: str  # "Low Risk", "Medium Risk", "High Risk Signal"
    window_hours: int = 24          # hours in the active window (from env)
    window_start: datetime
    window_end: datetime

    def model_post_init(self, __context):
        # Keep the legacy field in sync automatically
        if self.report_count_7d is None:
            self.report_count_7d = self.report_count_active
