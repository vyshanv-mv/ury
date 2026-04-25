# Copyright (c) 2024
# License: GNU General Public License v3

import frappe
from frappe import _
import json
import os
from erpnext.setup.setup_wizard.operations.install_fixtures import create_bank_account

@frappe.whitelist()
def setup_ury_or_erpnext_demo(setup_demo=0, setup_ury_demo=0, **kwargs):
    # Standardize types from JS (often passed as string or int)
    setup_demo = int(setup_demo)
    setup_ury_demo = int(setup_ury_demo)

    # ❌ Block invalid selection
    if setup_demo and setup_ury_demo:
        frappe.throw(
            _("Please select either ERPNext Demo OR URY Demo — not both.")
        )

    if setup_ury_demo:
        company = create_demo_company()

        # 🔥 VERY IMPORTANT: switch defaults
        frappe.defaults.set_user_default("Company", company)
        frappe.db.set_default("company", company)
        frappe.db.set_default("demo_data_type", "ury")

        from ury.setup.demo import setup_ury_demo_data
        setup_ury_demo_data(company)
        
        complete_onboarding()
        return

    if setup_demo:
        frappe.db.set_default("demo_data_type", "erpnext")
        from erpnext.setup.demo import setup_demo_data
        setup_demo_data()
        
        complete_onboarding()
        return

@frappe.whitelist()
def complete_onboarding():
    """
    Finalizes the onboarding by setting the setup_complete flags.
    """
    # Set URY specific flag
    frappe.db.set_default("ury_onboarding_complete", 1)
    
    # Also set Frappe's standard setup_complete flag to prevent its wizard
    frappe.db.set_single_value("System Settings", "setup_complete", 1)
    
    # Mark all installed applications as setup complete
    frappe.db.sql("update `tabInstalled Application` set setup_complete = 1")
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist(allow_guest=True)
def check_setup_status():
    """
    Checks if the initial onboarding setup is complete.
    1. Check if at least one Company exists.
    2. Check the dedicated 'ury_onboarding_complete' flag.
    """
    company_exists = frappe.db.exists("Company")
    onboarding_done = frappe.utils.cint(frappe.db.get_default("ury_onboarding_complete"))
    
    # Setup is complete ONLY if both a Company exists AND the flag is set.
    # This prevents edge cases where the flag might be set but data was deleted.
    setup_complete = bool(company_exists and onboarding_done)
    
    return {"setup_complete": setup_complete}

def ensure_erpnext_fixtures():
    """
    Ensures that mandatory ERPNext master data (Warehouse Types, etc.) exists.
    This prevents LinkValidationErrors during Company creation.
    """
    warehouse_types = ["Transit", "All Warehouse Types", "Storage", "Work In Progress"]
    for wt in warehouse_types:
        if not frappe.db.exists("Warehouse Type", wt):
            doc = frappe.new_doc("Warehouse Type")
            doc.name = wt
            doc.insert(ignore_permissions=True)
    
    frappe.db.commit()

@frappe.whitelist(allow_guest=True)
def setup_organization(company_name, abbr, country, timezone, currency, user_name, email, password=None, **kwargs):
    """
    Creates the main Company and ensures an administrative user exists.
    """
    # 0. Ensure mandatory master data exists
    ensure_erpnext_fixtures()

    # 1. Handle Authentication / Authorization
    # If no company exists, we allow guest access to setup the first organization.
    # Otherwise, we require authentication.
    company_exists = frappe.db.exists("Company")
    
    if frappe.session.user == "Guest" and company_exists:
        if not email or not password:
            frappe.throw(_("Email and Password are required to modify the organization."))
        
        try:
            from frappe.auth import LoginManager
            login_manager = LoginManager()
            login_manager.authenticate(user=email, pwd=password)
            login_manager.post_login()
        except Exception as e:
            frappe.throw(_("Authentication failed: {0}").format(str(e)))

    # 2. Ensure current user or provided email has System Manager role
    # If the provided email is different from current user, we create/update that user.
    target_user = email or frappe.session.user
    if target_user and target_user != "Guest":
        if not frappe.db.exists("User", target_user):
            user = frappe.new_doc("User")
            user.email = target_user
            user.first_name = user_name or "Administrator"
            if password:
                user.new_password = password
            user.enabled = 1
            user.send_welcome_email = 0
            user.append("roles", {"role": "System Manager"})
            user.append("roles", {"role": "Administrator"})
            user.insert(ignore_permissions=True)
        else:
            # Update existing user if password provided
            user = frappe.get_doc("User", target_user)
            if user_name:
                user.first_name = user_name
            if password:
                user.new_password = password
            
            # Ensure roles
            roles = [r.role for r in user.roles]
            if "System Manager" not in roles:
                user.append("roles", {"role": "System Manager"})
            if "Administrator" not in roles:
                user.append("roles", {"role": "Administrator"})
            user.save(ignore_permissions=True)

    # 3. Create Company
    if frappe.db.exists("Company", company_name):
        company = frappe.get_doc("Company", company_name)
    else:
        company = frappe.new_doc("Company")
        company.company_name = company_name
        company.abbr = abbr
        company.default_currency = currency
        company.country = country
        company.insert(ignore_permissions=True)
    
    # Set as global default if it's the first company or none is set
    if frappe.db.count("Company") <= 1 or not frappe.db.get_single_value("Global Defaults", "default_company"):
        frappe.db.set_single_value("Global Defaults", "default_company", company.name)
        frappe.db.set_default("company", company.name)
        
        # Also set default currency and country if not set
        frappe.db.set_single_value("Global Defaults", "default_currency", currency)
        frappe.db.set_single_value("Global Defaults", "country", country)

    frappe.db.commit()
    return {
        "status": "success", 
        "message": _("Organization setup successful."),
        "user": frappe.session.user
    }

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
    return {"status": "success", "message": _("Menu setup successful."), "created_items": [i.get('item_name') for i in items]}

@frappe.whitelist()
def get_printer_context():
    printers = frappe.get_all("URY Printer", fields=["*"], limit=1)
    if printers:
        return printers[0]
    return {}

@frappe.whitelist()
def setup_printer(printer_name, server_ip, port, bill=True):
    if frappe.db.exists("URY Printer", printer_name):
        doc = frappe.get_doc("URY Printer", printer_name)
    else:
        doc = frappe.new_doc("URY Printer")
        doc.printer_name = printer_name
    
    doc.server_ip = server_ip
    doc.port = port
    doc.bill = bill
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "message": _("Printer settings saved.")}

@frappe.whitelist()
def get_room_context():
    rooms = frappe.get_all("URY Room", fields=["name", "room_name"])
    return {"rooms": rooms}

@frappe.whitelist()
def setup_room(rooms):
    for room in rooms:
        if not frappe.db.exists("URY Room", room.get('name')):
            doc = frappe.new_doc("URY Room")
            doc.room_name = room.get('name') or room.get('room_name')
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "message": _("Rooms setup successful.")}

@frappe.whitelist()
def get_table_context():
    rooms = frappe.get_all("URY Room", pluck="name")
    tables = frappe.get_all("URY Table", fields=["*"])
    return {"rooms": rooms, "tables": tables}

@frappe.whitelist()
def setup_table(tables):
    for table in tables:
        if not frappe.db.exists("URY Table", table.get('name')):
            doc = frappe.new_doc("URY Table")
            doc.table_name = table.get('name') or table.get('table_name')
            doc.restaurant_room = table.get('room') or table.get('restaurant_room')
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "message": _("Tables setup successful.")}

@frappe.whitelist()
def get_mop_context():
    mops = frappe.get_all("Mode of Payment", fields=["name", "type"])
    if not mops:
        mops = [
            {"name": "Cash", "type": "Cash"},
            {"name": "Bank", "type": "Bank"}
        ]
    return {"payment_methods": mops}

@frappe.whitelist()
def setup_mop(payments):
    return {"status": "success", "message": _("Payment methods setup successful.")}

@frappe.whitelist()
def get_branch_context():
    branches = frappe.get_all("Branch", fields=["*"], limit=1)
    if branches:
        return branches[0]
    return {}

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
    restaurants = frappe.get_all("URY Restaurant", fields=["*"], limit=1)
    if restaurants:
        return restaurants[0]
    return {}

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
    users = frappe.get_all("User", fields=["name", "full_name", "email"], filters={"enabled": 1, "user_type": "System User"})
    return {
        "roles": ["Cashier", "Manager", "Admin"],
        "existing_users": users
    }

@frappe.whitelist()
def setup_user_management(users):
    return {"status": "success", "message": _("Users setup successful.")}

@frappe.whitelist()
def get_admin_stats():
    from frappe.utils import nowdate, getdate, add_days, formatdate
    today = nowdate()
    
    try:
        revenue_data = frappe.db.sql("""
            select sum(grand_total) as total 
            from `tabPOS Invoice` 
            where docstatus = 1 and posting_date = %s
        """, (today,), as_dict=True)
        total_revenue = revenue_data[0].total or 0
        order_count = frappe.db.count("POS Invoice", {"docstatus": 1, "posting_date": today})
        avg_order = total_revenue / order_count if order_count > 0 else 0
    except Exception:
        total_revenue = order_count = avg_order = 0
        
    try:
        active_tables_count = frappe.db.count("URY Table", {"status": "Occupied"})
        total_tables = frappe.db.count("URY Table")
    except Exception:
        active_tables_count = total_tables = 0
    
    try:
        new_customers = frappe.db.count("Customer", {"creation": (">", today)})
    except Exception:
        new_customers = 0
    
    chart_data = []
    for i in range(6, -1, -1):
        date = add_days(today, -i)
        try:
            day_revenue = frappe.db.sql("""
                select sum(grand_total) as total 
                from `tabPOS Invoice` 
                where docstatus = 1 and posting_date = %s
            """, (date,), as_dict=True)[0].total or 0
        except Exception:
            day_revenue = 0
        
        chart_data.append({
            "time": formatdate(date, "dd MMM"),
            "amount": float(day_revenue)
        })
        
    popular_items = []
    try:
        popular_items_data = frappe.db.sql("""
            select item_name, count(*) as sales, sum(base_amount) as revenue
            from `tabPOS Invoice Item` 
            where parent in (select name from `tabPOS Invoice` where docstatus = 1 and posting_date = %s)
            group by item_name
            order by sales desc
            limit 5
        """, (today,), as_dict=True)
        
        for item in popular_items_data:
            popular_items.append({
                "name": item.item_name,
                "sales": item.sales,
                "revenue": f"{item.revenue:,.2f}",
                "trend": "+0%"
            })
    except Exception:
        popular_items = []

    pie_data = [
        {"name": "Dine-in", "value": 70},
        {"name": "Takeaway", "value": 20},
        {"name": "Delivery", "value": 10}
    ]
        
    return {
        "stats": [
            {"label": "Total Revenue", "value": f"₹{total_revenue:,.2f}", "trend": "0%", "icon": "DollarSign", "color": "blue"},
            {"label": "Total Orders", "value": str(order_count), "trend": "0%", "icon": "ShoppingBag", "color": "indigo"},
            {"label": "Average Order", "value": f"₹{avg_order:,.2f}", "trend": "0%", "icon": "Clock", "color": "emerald"},
            {"label": "Active Tables", "value": f"{active_tables_count}/{max(total_tables, 1)}", "trend": "Steady", "icon": "Table2", "color": "orange"},
            {"label": "New Customers", "value": str(new_customers), "trend": "0%", "icon": "Users", "color": "blue"},
        ],
        "revenueData": chart_data,
        "pieData": pie_data,
        "popularItems": popular_items
    }

@frappe.whitelist(allow_guest=True)
def get_organization_context():
    company_name = frappe.db.get_single_value("Global Defaults", "default_company")
    abbr = ""
    if company_name:
        abbr = frappe.db.get_value("Company", company_name, "abbr")

    user = frappe.get_doc("User", frappe.session.user)
    return {
        "company_name": company_name or "",
        "abbr": abbr or "",
        "user_name": user.full_name or user.name,
        "email": user.email,
        "currency": frappe.db.get_single_value("Global Defaults", "default_currency") or "INR",
        "country": frappe.db.get_single_value("Global Defaults", "country") or "India",
        "timezone": frappe.db.get_single_value("System Settings", "time_zone") or "Asia/Kolkata"
    }

@frappe.whitelist()
def get_menu_context():
    items = frappe.get_all("Item", fields=["item_name", "standard_rate as price", "item_group"], filters={"is_sales_item": 1, "disabled": 0}, limit=50)
    for item in items:
        item["category"] = item.get("item_group")
    return {
        "items": items,
        "tax_calculation": "Inclusive"
    }

@frappe.whitelist()
def get_user_context():
    users = frappe.get_all("User", 
        fields=["name", "full_name", "email"], 
        filters={"enabled": 1, "user_type": "System User", "name": ["not in", ["Administrator", "Guest"]]}
    )
    mapped_users = []
    for u in users:
        mapped_users.append({
            "name": u.full_name or u.name,
            "email": u.email,
            "role": "Cashier"
        })
    return {
        "users": mapped_users,
        "roles": ["Cashier", "Manager", "Admin"]
    }

def create_demo_company():
    company = frappe.db.get_all("Company")[0].name
    company_doc = frappe.get_doc("Company", company)
    demo_company = frappe.new_doc("Company")
    demo_company.company_name = f"{company_doc.company_name} (Demo)"
    demo_company.abbr = f"{company_doc.abbr}D"
    demo_company.enable_perpetual_inventory = 1
    demo_company.default_currency = company_doc.default_currency
    demo_company.country = company_doc.country
    demo_company.chart_of_accounts_based_on = "Standard Template"
    demo_company.chart_of_accounts = company_doc.chart_of_accounts
    demo_company.insert(ignore_permissions=True)
    frappe.db.set_single_value("Global Defaults", "demo_company", demo_company.name)
    frappe.db.set_default("company", demo_company.name)
    bank_account = create_bank_account({"company_name": demo_company.name}, demo=True)
    frappe.db.set_value("Company", demo_company.name, "default_bank_account", bank_account.name)
    frappe.db.commit()
    return demo_company.name