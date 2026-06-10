"""Seed the database with demo roles, permissions, and users."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from database import engine, SessionLocal, Base
import models
from auth import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(models.User).count() > 0:
            print("Database already seeded. Skipping.")
            return

        # --- Permissions ---
        permission_defs = [
            ("view", "policy", "View insurance policies"),
            ("create", "policy", "Create insurance policies"),
            ("update", "policy", "Update insurance policies"),
            ("delete", "policy", "Delete insurance policies"),
            ("view", "claim", "View insurance claims"),
            ("create", "claim", "Submit an insurance claim"),
            ("approve", "claim", "Approve an insurance claim"),
            ("reject", "claim", "Reject an insurance claim"),
            ("view", "medical_report", "View medical reports"),
            ("upload", "medical_report", "Upload medical reports"),
            ("delete", "medical_report", "Delete medical reports"),
            ("view", "customer_profile", "View customer profiles"),
            ("update", "customer_profile", "Update customer profiles"),
            ("view", "premium_info", "View premium information"),
            ("view", "risk_assessment", "View risk assessments"),
            ("create", "risk_assessment", "Create risk assessments"),
        ]

        perms = {}
        for action, resource, desc in permission_defs:
            p = models.Permission(action=action, resource=resource, description=desc)
            db.add(p)
            db.flush()
            perms[f"{action}_{resource}"] = p

        # --- Roles ---
        role_defs = [
            ("Customer", "Health insurance customer — can view their own policy and claims"),
            ("Doctor", "Medical professional — manages medical reports"),
            ("Claims Officer", "Processes and approves/rejects insurance claims"),
            ("Insurance Agent", "Sells and manages insurance policies"),
            ("Underwriter", "Assesses risk and sets premiums"),
            ("Compliance Auditor", "Read-only auditor for compliance review"),
            ("Admin", "Full system administrator access"),
        ]

        roles = {}
        for name, desc in role_defs:
            r = models.Role(name=name, description=desc)
            db.add(r)
            db.flush()
            roles[name] = r

        # --- Role → Permission assignments ---
        role_permissions = {
            "Customer": ["view_policy", "view_claim", "create_claim", "view_customer_profile"],
            "Doctor": ["view_medical_report", "upload_medical_report", "view_claim"],
            "Claims Officer": ["view_claim", "approve_claim", "reject_claim", "view_medical_report", "view_customer_profile"],
            "Insurance Agent": ["view_policy", "create_policy", "update_policy", "view_customer_profile", "update_customer_profile", "view_premium_info"],
            "Underwriter": ["view_policy", "view_risk_assessment", "create_risk_assessment", "view_premium_info", "view_claim"],
            "Compliance Auditor": ["view_policy", "view_claim", "view_medical_report", "view_customer_profile", "view_premium_info", "view_risk_assessment"],
            "Admin": list(perms.keys()),
        }

        for role_name, perm_keys in role_permissions.items():
            for key in perm_keys:
                if key in perms:
                    rp = models.RolePermission(
                        role_id=roles[role_name].id,
                        permission_id=perms[key].id,
                    )
                    db.add(rp)

        # --- Users ---
        user_defs = [
            ("admin@phi.com", "Admin User", "Admin"),
            ("customer@phi.com", "Rahul Sharma", "Customer"),
            ("doctor@phi.com", "Dr. Priya Nair", "Doctor"),
            ("claims@phi.com", "Amit Verma", "Claims Officer"),
        ]

        for email, full_name, role_name in user_defs:
            u = models.User(
                email=email,
                full_name=full_name,
                hashed_password=hash_password("password"),
            )
            db.add(u)
            db.flush()
            ur = models.UserRole(user_id=u.id, role_id=roles[role_name].id)
            db.add(ur)

        db.commit()
        print("Database seeded successfully!")
        print("  Users: admin@phi.com, customer@phi.com, doctor@phi.com, claims@phi.com")
        print("  Password for all: 'password'")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
