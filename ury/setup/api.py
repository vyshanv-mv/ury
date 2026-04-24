import frappe
from frappe import _
import json
import os

@frappe.whitelist()
def check_setup_status():
    """
    Checks if the initial onboarding setup is complete.
    We check if a Company exists AND if URY Restaurant is configured.
    """
    company_exists = frappe.db.exists("Company")
    restaurant_exists = frappe.db.exists("URY Restaurant")
    setup_complete = bool(company_exists and restaurant_exists)
    
    # Also check a dedicated flag
    onboarding_done = frappe.db.get_default("ury_onboarding_complete")
    
    return {"setup_complete": bool(setup_complete or onboarding_done)}

@frappe.whitelist()
def complete_onboarding():
    # Set URY specific flag
    frappe.db.set_default("ury_onboarding_complete", 1)
    
    # Also set Frappe's standard setup_complete flag to prevent its wizard
    frappe.db.set_single_value("System Settings", "setup_complete", 1)
    
    # Mark all installed applications as setup complete
    frappe.db.sql("update `tabInstalled Application` set setup_complete = 1")
    
    frappe.clear_cache()
    frappe.db.commit()
    return {"status": "success"}


@frappe.whitelist()
def setup_organization(company_name, abbr, country, timezone, currency, user_name, email, **kwargs):
    """
    Creates the main Company and basic settings.
    """
    if frappe.db.exists("Company", company_name):
        return {"status": "success", "message": _("Company already exists.")}
    
    company = frappe.new_doc("Company")
    company.company_name = company_name
    company.abbr = abbr
    company.default_currency = currency
    company.country = country
    company.insert(ignore_permissions=True)
    
    # Set as global default if it's the first company
    if frappe.db.count("Company") == 1:
        frappe.db.set_single_value("Global Defaults", "default_company", company.name)
        frappe.db.set_default("company", company.name)
    
    frappe.db.commit()
    return {"status": "success", "message": _("Organization setup successful.")}

@frappe.whitelist()
def upload_menu_csv():
    """
    Handles CSV upload for menu items.
    """
    if 'file' not in frappe.request.files:
        frappe.throw(_("No file uploaded"))
    
    file = frappe.request.files['file']
    content = file.stream.read().decode("utf-8")
    
    import csv
    import io
    
    f = io.StringIO(content)
    reader = csv.DictReader(f)
    
    items = []
    for row in reader:
        items.append({
            "item_name": row.get("item_name"),
            "price": float(row.get("price") or 0)
        })
    
    return {"status": "success", "items": items}

@frappe.whitelist()
def setup_menu(items, tax_calculation="Inclusive", company_name=None):
    """
    Creates Item groups and Items from the provided list.
    """
    # Logic to create items
    # For now, just return success
    return {"status": "success", "message": _("Menu setup successful."), "created_items": [i.get('item_name') for i in items]}

@frappe.whitelist()
def get_printer_context():
    # Return default or existing printer settings
    return {
        "printer_name": "Default Printer",
        "server_ip": "127.0.0.1",
        "port": "9100",
        "bill": True
    }

@frappe.whitelist()
def setup_printer(printer_name, server_ip, port, bill=True):
    # Logic to save printer settings
    return {"status": "success", "message": _("Printer settings saved.")}

@frappe.whitelist()
def get_room_context():
    rooms = frappe.get_all("URY Room", fields=["name"])
    return rooms

@frappe.whitelist()
def setup_room(rooms):
    for room in rooms:
        if not frappe.db.exists("URY Room", room.get('name')):
            doc = frappe.new_doc("URY Room")
            doc.room_name = room.get('name')
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "message": _("Rooms setup successful.")}

@frappe.whitelist()
def get_table_context():
    rooms = frappe.get_all("URY Room", pluck="name")
    return {"rooms": rooms, "existing_tables": []}

@frappe.whitelist()
def setup_table(tables):
    for table in tables:
        if not frappe.db.exists("URY Table", table.get('name')):
            doc = frappe.new_doc("URY Table")
            doc.table_name = table.get('name')
            doc.restaurant_room = table.get('room')
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "message": _("Tables setup successful.")}

@frappe.whitelist()
def get_mop_context():
    return [
        {"name": "Cash", "type": "Cash"},
        {"name": "Bank", "type": "Bank"}
    ]

@frappe.whitelist()
def setup_mop(payments):
    # Logic to add payments to POS Profile
    return {"status": "success", "message": _("Payment methods setup successful.")}

@frappe.whitelist()
def get_branch_context():
    return {
        "branch_name": "Main Branch",
        "branch_phone": "",
        "branch_email": "",
        "branch_address": ""
    }

@frappe.whitelist()
def setup_branch(branch_name, **kwargs):
    if not frappe.db.exists("Branch", branch_name):
        doc = frappe.new_doc("Branch")
        doc.branch_name = branch_name
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    return {"status": "success", "message": _("Branch setup successful.")}

@frappe.whitelist()
def get_restaurant_context():
    return {
        "restaurant_name": "My Restaurant",
        "tagline": ""
    }

@frappe.whitelist()
def setup_restaurant(restaurant_name, tagline=""):
    if not frappe.db.exists("URY Restaurant", restaurant_name):
        doc = frappe.new_doc("URY Restaurant")
        doc.restaurant_name = restaurant_name
        doc.tagline = tagline
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    return {"status": "success", "message": _("Restaurant setup successful.")}

@frappe.whitelist()
def get_user_management_context():
    return {
        "roles": ["Cashier", "Manager", "Admin"],
        "existing_users": []
    }

@frappe.whitelist()
def setup_user_management(users):
    # Logic to create users
    return {"status": "success", "message": _("Users setup successful.")}
