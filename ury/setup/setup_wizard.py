import frappe
from frappe import _
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
    frappe.db.set_default("ury_onboarding_complete", 1)
    frappe.db.set_single_value("System Settings", "setup_complete", 1)
    frappe.db.sql("update `tabInstalled Application` set setup_complete = 1")
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist(allow_guest=True)
def check_setup_status():
    company_exists = frappe.db.exists("Company")
    onboarding_done = frappe.utils.cint(frappe.db.get_default("ury_onboarding_complete"))
    return {"setup_complete": bool(company_exists and onboarding_done)}

def ensure_erpnext_fixtures():
    """
    Ensures that mandatory ERPNext master data (Warehouse Types, etc.) exists.
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
    ensure_erpnext_fixtures()

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

    target_user = email or frappe.session.user
    if target_user and target_user != "Guest":
        if not frappe.db.exists("User", target_user):
            user = frappe.new_doc("User")
            user.email = target_user
            user.first_name = user_name or "Administrator"
            if password:
                user.new_password = password
            user.enabled = 1
            user.user_type = "System User"
            user.send_welcome_email = 0
            user.append("roles", {"role": "System Manager"})
            user.append("roles", {"role": "Administrator"})
            user.insert(ignore_permissions=True)
        else:
            user = frappe.get_doc("User", target_user)
            if user_name:
                user.first_name = user_name
            if password:
                user.new_password = password
            
            roles = [r.role for r in user.roles]
            if "System Manager" not in roles:
                user.append("roles", {"role": "System Manager"})
            if "Administrator" not in roles:
                user.append("roles", {"role": "Administrator"})
            user.save(ignore_permissions=True)

    if frappe.db.exists("Company", company_name):
        company = frappe.get_doc("Company", company_name)
    else:
        company = frappe.new_doc("Company")
        company.company_name = company_name
        company.abbr = abbr
        company.default_currency = currency
        company.country = country
        company.insert(ignore_permissions=True)
    
    if frappe.db.count("Company") <= 1 or not frappe.db.get_single_value("Global Defaults", "default_company"):
        frappe.db.set_single_value("Global Defaults", "default_company", company.name)
        frappe.db.set_default("company", company.name)
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
    if not items:
        return {"status": "success"}

    default_group = "Products"
    if not frappe.db.exists("Item Group", default_group):
        doc = frappe.new_doc("Item Group")
        doc.item_group_name = default_group
        doc.is_group = 0
        doc.parent_item_group = "All Item Groups"
        doc.insert(ignore_permissions=True)

    created_count = 0
    for item in items:
        name = item.get("item_name")
        price = item.get("price")
        category = item.get("category") or default_group

        if not name: continue

        if not frappe.db.exists("Item Group", category):
            ig = frappe.new_doc("Item Group")
            ig.item_group_name = category
            ig.is_group = 0
            ig.parent_item_group = "All Item Groups"
            ig.insert(ignore_permissions=True)

        if not frappe.db.exists("Item", name):
            doc = frappe.new_doc("Item")
            doc.item_code = name
            doc.item_name = name
            doc.item_group = category
            doc.is_sales_item = 1
            doc.stock_uom = "Nos"
            doc.standard_rate = flt(price)
            doc.insert(ignore_permissions=True)
            created_count += 1
        else:
            doc = frappe.get_doc("Item", name)
            doc.standard_rate = flt(price)
            doc.save(ignore_permissions=True)

    frappe.db.commit()
    return {"status": "success", "message": _("{0} items updated.").format(created_count)}

@frappe.whitelist()
def get_printer_context():
    printers = frappe.get_all("URY Printer", fields=["*"], limit=1)
    return printers[0] if printers else {}

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
        name = room.get('name') or room.get('room_name')
        if not frappe.db.exists("URY Room", name):
            doc = frappe.new_doc("URY Room")
            doc.room_name = name
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist()
def get_table_context():
    rooms = frappe.get_all("URY Room", pluck="name")
    tables = frappe.get_all("URY Table", fields=["*"])
    return {"rooms": rooms, "tables": tables}

@frappe.whitelist()
def setup_table(tables):
    for table in tables:
        name = table.get('name') or table.get('table_name')
        if not frappe.db.exists("URY Table", name):
            doc = frappe.new_doc("URY Table")
            doc.table_name = name
            doc.restaurant_room = table.get('room') or table.get('restaurant_room')
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist()
def get_mop_context():
    mops = frappe.get_all("Mode of Payment", fields=["name", "type"])
    return {"payment_methods": mops or [{"name": "Cash", "type": "Cash"}]}

@frappe.whitelist()
def setup_mop(payments):
    for mop in payments:
        name = mop.get("name")
        if not frappe.db.exists("Mode of Payment", name):
            doc = frappe.new_doc("Mode of Payment")
            doc.mode_of_payment = name
            doc.type = mop.get("type") or "Cash"
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist()
def get_branch_context():
    branches = frappe.get_all("Branch", fields=["*"], limit=1)
    return branches[0] if branches else {}

@frappe.whitelist()
def setup_branch(branch_name, **kwargs):
    if not frappe.db.exists("Branch", branch_name):
        doc = frappe.new_doc("Branch")
        doc.branch_name = branch_name
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist()
def get_restaurant_context():
    res = frappe.get_all("URY Restaurant", fields=["*"], limit=1)
    return res[0] if res else {}

@frappe.whitelist()
def setup_restaurant(restaurant_name, tagline=""):
    if not frappe.db.exists("URY Restaurant", restaurant_name):
        doc = frappe.new_doc("URY Restaurant")
        doc.restaurant_name = restaurant_name
        doc.tagline = tagline
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist()
def get_user_management_context():
    users = frappe.get_all("User", fields=["name", "full_name", "email"], filters={"enabled": 1, "user_type": "System User"})
    return {"roles": ["Cashier", "Manager", "Admin"], "existing_users": users}

@frappe.whitelist()
def setup_user_management(users):
    for u in users:
        email = u.get("email")
        if email and not frappe.db.exists("User", email):
            user = frappe.new_doc("User")
            user.email = email
            user.first_name = u.get("name")
            user.enabled = 1
            user.append("roles", {"role": u.get("role") or "Cashier"})
            user.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist()
def get_admin_stats():
    from frappe.utils import nowdate, add_days, formatdate
    today = nowdate()
    # Placeholder for actual stats
    return {"stats": [], "revenueData": [], "pieData": [], "popularItems": []}

@frappe.whitelist(allow_guest=True)
def get_organization_context():
    company = frappe.db.get_single_value("Global Defaults", "default_company")
    user = frappe.get_doc("User", frappe.session.user)
    return {
        "company_name": company or "",
        "abbr": frappe.db.get_value("Company", company, "abbr") if company else "",
        "user_name": user.full_name or user.name,
        "email": user.email,
        "currency": frappe.db.get_single_value("Global Defaults", "default_currency") or "INR",
        "country": frappe.db.get_single_value("Global Defaults", "country") or "India",
        "timezone": frappe.db.get_single_value("System Settings", "time_zone") or "Asia/Kolkata"
    }

@frappe.whitelist()
def get_menu_context():
    items = frappe.get_all("Item", fields=["item_name", "standard_rate as price", "item_group"], filters={"is_sales_item": 1}, limit=50)
    return {"items": items, "tax_calculation": "Inclusive"}

@frappe.whitelist()
def get_user_context():
    users = frappe.get_all("User", fields=["name", "full_name", "email"], filters={"enabled": 1, "name": ["not in", ["Administrator", "Guest"]]})
    return {"users": users, "roles": ["Cashier", "Manager", "Admin"]}

def create_demo_company():
    company = frappe.db.get_all("Company")[0].name
    company_doc = frappe.get_doc("Company", company)
    demo_company = frappe.new_doc("Company")
    demo_company.company_name = f"{company_doc.company_name} (Demo)"
    demo_company.abbr = f"{company_doc.abbr}D"
    demo_company.default_currency = company_doc.default_currency
    demo_company.country = company_doc.country
    demo_company.insert(ignore_permissions=True)
    frappe.db.set_default("company", demo_company.name)
    frappe.db.commit()
    return demo_company.name

def flt(val):
    from frappe.utils import flt as _flt
    return _flt(val)