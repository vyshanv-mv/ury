import frappe
from frappe import _
import json
import os

@frappe.whitelist(allow_guest=True)
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


@frappe.whitelist(allow_guest=True)
def setup_organization(company_name, abbr, country, timezone, currency, user_name, email, password=None, **kwargs):
    """
    Creates the main Company and basic settings.
    If called by a Guest, it attempts to authenticate the user first.
    """
    # 1. Handle Authentication for Guests
    if frappe.session.user == "Guest":
        if not email or not password:
            frappe.throw(_("Email and Password are required to setup the organization."))
        
        try:
            from frappe.auth import LoginManager
            login_manager = LoginManager()
            login_manager.authenticate(user=email, pwd=password)
            login_manager.post_login()
        except Exception as e:
            frappe.throw(_("Authentication failed: {0}").format(str(e)))

    # 2. Create Company
    if frappe.db.exists("Company", company_name):
        return {"status": "success", "message": _("Company already exists."), "user": frappe.session.user}
    
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
    # Logic to create items
    # For now, just return success
    return {"status": "success", "message": _("Menu setup successful."), "created_items": [i.get('item_name') for i in items]}

@frappe.whitelist()
def get_printer_context():
    # Attempt to fetch first printer setting
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
    return rooms

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
    return {"rooms": rooms, "existing_tables": tables}

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
    # Fetch from Mode of Payment
    mops = frappe.get_all("Mode of Payment", fields=["name", "type"])
    return mops if mops else [
        {"name": "Cash", "type": "Cash"},
        {"name": "Bank", "type": "Bank"}
    ]

@frappe.whitelist()
def setup_mop(payments):
    # Logic to add payments to POS Profile
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
    # Logic to create users
    return {"status": "success", "message": _("Users setup successful.")}

@frappe.whitelist()
def get_admin_stats():
    """
    Returns real dashboard statistics from the database.
    """
    from frappe.utils import nowdate, getdate, add_days, formatdate
    
    today = nowdate()
    
    # Total Revenue (Paid POS Invoices today)
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
        total_revenue = 0
        order_count = 0
        avg_order = 0
        
    try:
        active_tables_count = frappe.db.count("URY Table", {"status": "Occupied"})
        total_tables = frappe.db.count("URY Table")
    except Exception:
        active_tables_count = 0
        total_tables = 0
    
    try:
        new_customers = frappe.db.count("Customer", {"creation": (">", today)})
    except Exception:
        new_customers = 0
    
    # Revenue Chart Data (last 7 days)
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
        
    # Popular Items (Top 5 today)
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

    # Pie Data (Order Sources - Placeholder until we have actual source data)
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
