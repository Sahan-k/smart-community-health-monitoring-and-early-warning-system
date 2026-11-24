import os
import sys
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app

client = TestClient(app)
results = []

def record(test_name, success, detail=""):
    results.append({"test": test_name, "status": "PASS" if success else "FAIL", "detail": detail})
    status_str = "[PASS]" if success else "[FAIL]"
    print(f"{status_str} {test_name} - {detail}")

def run_tests():
    print("=== Running HealthGuard AI In-Process Test Client Suite ===")

    # 1. Health check
    r = client.get("/health")
    record("Backend Health Check", r.status_code == 200, f"Status: {r.status_code}")

    # 2. Public Registration - Reject Administrator (403 or 400 or 422)
    admin_reg = {
        "username": "rogue_admin",
        "email": "rogue@example.com",
        "phone_number": "9876543299",
        "role": "administrator",
        "password": "Password@123"
    }
    r = client.post("/api/auth/register", json=admin_reg)
    record(
        "Public Registration - Rejection of Administrator Role",
        r.status_code in [400, 403, 422],
        f"Status: {r.status_code}, Detail: {r.text[:120]}"
    )

    # 3. Password Validation - Missing Uppercase (Must fail 422)
    bad_pwd_reg = {
        "username": "test_badpwd",
        "email": "badpwd@example.com",
        "phone_number": "9876543298",
        "role": "community_member",
        "password": "password@123"
    }
    r = client.post("/api/auth/register", json=bad_pwd_reg)
    record(
        "Registration Validation - Missing Uppercase in Password",
        r.status_code == 422,
        f"Status: {r.status_code}, Detail: {r.text[:120]}"
    )

    # 4. Password Validation - Missing Special Character (Must fail 422)
    bad_pwd2 = {
        "username": "test_badpwd2",
        "email": "badpwd2@example.com",
        "phone_number": "9876543297",
        "role": "community_member",
        "password": "Password123"
    }
    r = client.post("/api/auth/register", json=bad_pwd2)
    record(
        "Registration Validation - Missing Special Character in Password",
        r.status_code == 422,
        f"Status: {r.status_code}, Detail: {r.text[:120]}"
    )

    # 5. Invalid Phone Number (Must fail 422)
    bad_phone = {
        "username": "test_badphone",
        "email": "badphone@example.com",
        "phone_number": "1234567890",
        "role": "community_member",
        "password": "Password@123"
    }
    r = client.post("/api/auth/register", json=bad_phone)
    record(
        "Registration Validation - Invalid Mobile Format (Not starting 6-9)",
        r.status_code == 422,
        f"Status: {r.status_code}, Detail: {r.text[:120]}"
    )

    # 6. Public Registration - Community Member
    cm_reg = {
        "username": "test_cm_auto",
        "email": "test_cm_auto@example.com",
        "phone_number": "9876543219",
        "role": "community_member",
        "password": "Password@123"
    }
    r = client.post("/api/auth/register", json=cm_reg)
    if r.status_code in [201, 200]:
        record("Public Registration - Community Member", True, f"Created user ID {r.json().get('user', {}).get('id')}")
    elif "already" in r.text.lower():
        record("Public Registration - Community Member (Already registered)", True, "User exists from prior run")
    else:
        record("Public Registration - Community Member", False, f"Status: {r.status_code}, {r.text}")

    # 7. Duplicate Username / Email Check
    r = client.post("/api/auth/register", json=cm_reg)
    record(
        "Registration Validation - Duplicate Username/Email Rejection",
        r.status_code in [400, 422] and "already" in r.text.lower(),
        f"Status: {r.status_code}, Detail: {r.text[:120]}"
    )

    # 8. Public Registration - ASHA Worker (health_worker)
    hw_reg = {
        "username": "test_hw_auto",
        "email": "test_hw_auto@example.com",
        "phone_number": "9876543229",
        "role": "health_worker",
        "password": "Password@123"
    }
    r = client.post("/api/auth/register", json=hw_reg)
    if r.status_code in [201, 200]:
        record("Public Registration - ASHA Worker", True, f"Created user ID {r.json().get('user', {}).get('id')}")
    elif "already" in r.text.lower():
        record("Public Registration - ASHA Worker (Already registered)", True, "User exists from prior run")
    else:
        record("Public Registration - ASHA Worker", False, f"Status: {r.status_code}, {r.text}")

    # 9. Public Registration - Doctor (healthcare_professional)
    dr_reg = {
        "username": "test_dr_auto",
        "email": "test_dr_auto@example.com",
        "phone_number": "9876543239",
        "role": "healthcare_professional",
        "password": "Password@123"
    }
    r = client.post("/api/auth/register", json=dr_reg)
    if r.status_code in [201, 200]:
        record("Public Registration - Doctor", True, f"Created user ID {r.json().get('user', {}).get('id')}")
    elif "already" in r.text.lower():
        record("Public Registration - Doctor (Already registered)", True, "User exists from prior run")
    else:
        record("Public Registration - Doctor", False, f"Status: {r.status_code}, {r.text}")

    # 10. Login - Predefined Administrator Account (Sahan / Sahan@123)
    admin_login = {
        "identifier": "Sahan",
        "password": "Sahan@123",
        "role": "administrator"
    }
    r = client.post("/api/auth/login", json=admin_login)
    admin_token = None
    if r.status_code == 200 and r.json().get("user", {}).get("role") == "administrator":
        admin_token = r.json().get("access_token")
        record("Login - Predefined Administrator (Sahan / Sahan@123)", True, "Token issued, role confirmed administrator")
    else:
        record("Login - Predefined Administrator", False, f"Status: {r.status_code}, Detail: {r.text}")

    # 11. Login with Admin Email identifier
    admin_email_login = {
        "identifier": "dsahan741@gmail.com",
        "password": "Sahan@123",
        "role": "administrator"
    }
    r = client.post("/api/auth/login", json=admin_email_login)
    record("Login - Admin via Email Identifier", r.status_code == 200, f"Status: {r.status_code}")

    # 12. Login - Role Mismatch Rejection (Citizen rahul trying to login as Doctor)
    mismatch_login = {
        "identifier": "citizen_rahul",
        "password": "Password@123",
        "role": "healthcare_professional"
    }
    r = client.post("/api/auth/login", json=mismatch_login)
    record(
        "Login Role Validation - Mismatched Role Rejected",
        r.status_code == 401 and "does not match" in r.text.lower(),
        f"Status: {r.status_code}, Detail: {r.text[:120]}"
    )

    # 13. Login - Bad Password Rejection
    bad_pwd_login = {
        "identifier": "citizen_rahul",
        "password": "WrongPassword999!",
        "role": "community_member"
    }
    r = client.post("/api/auth/login", json=bad_pwd_login)
    record(
        "Login Security - Invalid Password Rejection",
        r.status_code == 401,
        f"Status: {r.status_code}, Detail: {r.text[:120]}"
    )

    # 14. Login - Community Member (citizen_rahul / Password@123)
    cm_login = {
        "identifier": "citizen_rahul",
        "password": "Password@123",
        "role": "community_member"
    }
    r = client.post("/api/auth/login", json=cm_login)
    cm_token = r.json().get("access_token") if r.status_code == 200 else None
    record("Login - Community Member Demo Account", r.status_code == 200 and r.json().get("user", {}).get("role") == "community_member", f"Status: {r.status_code}")

    # 15. Login - ASHA Worker (asha_sunita / Password@123)
    hw_login = {
        "identifier": "asha_sunita",
        "password": "Password@123",
        "role": "health_worker"
    }
    r = client.post("/api/auth/login", json=hw_login)
    hw_token = r.json().get("access_token") if r.status_code == 200 else None
    record("Login - ASHA Worker Demo Account", r.status_code == 200 and r.json().get("user", {}).get("role") == "health_worker", f"Status: {r.status_code}")

    # 16. Login - Doctor (dr_rajesh / Password@123)
    dr_login = {
        "identifier": "dr_rajesh",
        "password": "Password@123",
        "role": "healthcare_professional"
    }
    r = client.post("/api/auth/login", json=dr_login)
    dr_token = r.json().get("access_token") if r.status_code == 200 else None
    record("Login - Doctor Demo Account", r.status_code == 200 and r.json().get("user", {}).get("role") == "healthcare_professional", f"Status: {r.status_code}")

    # 17. Protected API Endpoint RBAC - Admin Users Endpoint (/api/users)
    if cm_token:
        r = client.get("/api/users", headers={"Authorization": f"Bearer {cm_token}"})
        record("RBAC Protection - /api/users Blocked for Community Member", r.status_code == 403, f"Status: {r.status_code}")

    if hw_token:
        r = client.get("/api/users", headers={"Authorization": f"Bearer {hw_token}"})
        record("RBAC Protection - /api/users Blocked for ASHA Worker", r.status_code == 403, f"Status: {r.status_code}")

    if dr_token:
        r = client.get("/api/users", headers={"Authorization": f"Bearer {dr_token}"})
        record("RBAC Protection - /api/users Blocked for Doctor", r.status_code == 403, f"Status: {r.status_code}")

    if admin_token:
        r = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
        record("RBAC Authorization - /api/users Allowed for Administrator", r.status_code == 200, f"Status: {r.status_code}, Total users: {len(r.json()) if isinstance(r.json(), list) else 'N/A'}")

    # 18. Alert Review Endpoint Protection (/api/alerts/1/review)
    if cm_token:
        r = client.post("/api/alerts/1/review", json={"decision": "verified"}, headers={"Authorization": f"Bearer {cm_token}"})
        record("RBAC Protection - Alert Review Blocked for Community Member", r.status_code == 403, f"Status: {r.status_code}")

    # Summary
    pass_count = sum(1 for res in results if res["status"] == "PASS")
    fail_count = sum(1 for res in results if res["status"] == "FAIL")
    print(f"\n==========================================")
    print(f"Total Tests Executed: {len(results)}")
    print(f"Passed: {pass_count} | Failed: {fail_count}")
    print(f"==========================================")

if __name__ == "__main__":
    run_tests()
