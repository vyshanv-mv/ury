import csv
import io
import frappe
from frappe import _
from frappe.utils import flt, cint
from frappe.auth import LoginManager
from erpnext.setup.setup_wizard.operations.install_fixtures import create_bank_account

# --- Constants ---
WAREHOUSE_TYPES = ["Transit", "All Warehouse Types", "Storage", "Work In Progress"]
ADMIN_ROLES = ["System Manager", "Administrator"]
DEFAULT_ITEM_GROUP = "Products"

@frappe.whitelist(allow_guest=True)
def setup_ury_or_erpnext_demo(setup_demo=0, setup_ury_demo=0, **kwargs):
    """Initializes demo data for either ERPNext or URY POS."""
    setup_demo = cint(setup_demo)
    setup_ury_demo = cint(setup_ury_demo)

    if setup_demo and setup_ury_demo:
        frappe.throw(_("Please select either ERPNext Demo OR URY Demo — not both."))

    if not setup_demo and not setup_ury_demo:
        return {"status": "noop"}

    if setup_ury_demo:
        company = create_demo_company()
        frappe.defaults.set_user_default("Company", company)
        frappe.db.set_default("company", company)
        frappe.db.set_default("demo_data_type", "ury")

        from ury.setup.demo import setup_ury_demo_data
        setup_ury_demo_data(company)
        
        complete_onboarding()
        return {"status": "success"}

    if setup_demo:
        frappe.db.set_default("demo_data_type", "erpnext")
        from erpnext.setup.demo import setup_demo_data
        setup_demo_data()
        
        complete_onboarding()
        return {"status": "success"}

@frappe.whitelist(allow_guest=True)
def complete_onboarding():
    """Finalizes the onboarding by setting the global setup_complete flags."""
    frappe.db.set_default("ury_onboarding_complete", 1)
    
    # Force standard frappe setup_complete flags
    frappe.db.set_single_value("System Settings", "setup_complete", 1)
    
    # Update all installed applications
    for app_name in frappe.get_installed_apps():
        frappe.db.set_value("Installed Application", {"app_name": app_name}, "is_setup_complete", 1)
        
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist(allow_guest=True)
def check_setup_status():
    """Returns the current completion status of the setup wizard."""
    company_exists = frappe.db.exists("Company")
    onboarding_done = cint(frappe.db.get_default("ury_onboarding_complete"))
    return {"needs_onboarding": not bool(company_exists and onboarding_done)}

def ensure_erpnext_fixtures():
    """Ensures that mandatory ERPNext master data (Warehouse Types, etc.) exists."""
    for wt in WAREHOUSE_TYPES:
        if not frappe.db.exists("Warehouse Type", wt):
            doc = frappe.new_doc("Warehouse Type")
            doc.name = wt
            doc.insert(ignore_permissions=True)
    frappe.db.commit()

@frappe.whitelist(allow_guest=True)
def setup_organization(company_name, abbr, country, timezone, currency, user_name, email, password=None, **kwargs):
    """Creates the main Company and ensures an administrative user exists."""
    ensure_erpnext_fixtures()
    company_exists = frappe.db.exists("Company")
    
    # 1. Handle Guest Authentication and Login if re-entering setup
    if frappe.session.user == "Guest" and company_exists:
        if not email or not password:
            frappe.throw(_("Email and Password are required to modify the organization."))
        try:
            login_manager = LoginManager()
            login_manager.authenticate(user=email, pwd=password)
            login_manager.post_login()
        except Exception as e:
            frappe.throw(_("Authentication failed: {0}").format(str(e)))

    # 2. Setup or Update Admin User
    target_user = email or frappe.session.user
    setup_user = target_user
    
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
            for role in ADMIN_ROLES:
                user.append("roles", {"role": role})
            user.insert(ignore_permissions=True)
        else:
            user = frappe.get_doc("User", target_user)
            if user_name:
                user.first_name = user_name
            if password:
                user.new_password = password
            
            existing_roles = [r.role for r in user.roles]
            for role in ADMIN_ROLES:
                if role not in existing_roles:
                    user.append("roles", {"role": role})
            user.save(ignore_permissions=True)

    # 3. Setup Company with HRMS Resiliency
    if frappe.db.exists("Company", company_name):
        company = frappe.get_doc("Company", company_name)
    else:
        company = frappe.new_doc("Company")
        company.company_name = company_name
        company.abbr = abbr
        company.default_currency = currency
        company.country = country
        
        try:
            company.insert(ignore_permissions=True)
        except frappe.ValidationError as e:
            # WORKAROUND: HRMS regional setup for India fails if Salary Component is missing in cache
            if "Salary Component" in str(e) and country == "India":
                frappe.msgprint(_("Warning: HRMS regional setup for India skipped. POS setup will continue."), indicator="orange")
                try:
                    if "hrms" in frappe.get_installed_apps():
                        frappe.reload_doc("hrms", "doctype", "salary_component")
                    company.insert(ignore_permissions=True)
                except Exception as reload_err:
                    frappe.log_error(title="HRMS Regional Setup Failure", message=str(reload_err))
                    if frappe.db.exists("Company", company_name):
                        company = frappe.get_doc("Company", company_name)
                    else:
                        raise e
            else:
                raise e
    
    # 4. Set Global Defaults
    if frappe.db.count("Company") <= 1 or not frappe.db.get_single_value("Global Defaults", "default_company"):
        frappe.db.set_single_value("Global Defaults", "default_company", company.name)
        frappe.db.set_default("company", company.name)
        frappe.db.set_single_value("Global Defaults", "default_currency", currency)
        frappe.db.set_single_value("Global Defaults", "country", country)

    frappe.db.commit()
    return {
        "status": "success", 
        "message": _("Organization setup successful."),
        "user": setup_user
    }

@frappe.whitelist(allow_guest=True)
def get_organization_context():
    """Fetches existing organization details for the setup wizard."""
    company = frappe.db.get_single_value("Global Defaults", "default_company")
    
    if frappe.session.user != "Guest":
        user = frappe.get_doc("User", frappe.session.user)
    else:
        user = None
        
    return {
        "company_name": company or "",
        "abbr": frappe.db.get_value("Company", company, "abbr") if company else "",
        "user_name": user.full_name or user.name if user else "",
        "email": user.email if user else "",
        "currency": frappe.db.get_single_value("Global Defaults", "default_currency") or "INR",
        "country": frappe.db.get_single_value("Global Defaults", "country") or "India",
        "timezone": frappe.db.get_single_value("System Settings", "time_zone") or "Asia/Kolkata"
    }

@frappe.whitelist(allow_guest=True)
def upload_menu_csv():
    """Parses an uploaded CSV file for menu items."""
    if 'file' not in frappe.request.files:
        frappe.throw(_("No file uploaded"))
    
    file = frappe.request.files['file']
    content = file.stream.read().decode("utf-8")
    
    f = io.StringIO(content)
    reader = csv.DictReader(f)
    
    items = []
    for row in reader:
        items.append({
            "item_name": row.get("item_name"),
            "price": flt(row.get("price") or 0)
        })
    
    return {"status": "success", "items": items}

@frappe.whitelist(allow_guest=True)
def setup_menu(items, tax_calculation="Inclusive", company_name=None):
    """Creates Item Groups and Items from the provided list."""
    if not items:
        return {"status": "success"}

    if not frappe.db.exists("Item Group", DEFAULT_ITEM_GROUP):
        doc = frappe.new_doc("Item Group")
        doc.item_group_name = DEFAULT_ITEM_GROUP
        doc.is_group = 0
        doc.parent_item_group = "All Item Groups"
        doc.insert(ignore_permissions=True)

    created_count = 0
    for item in items:
        name = item.get("item_name")
        price = item.get("price")
        category = item.get("category") or DEFAULT_ITEM_GROUP

        if not name: 
            continue

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

@frappe.whitelist(allow_guest=True)
def get_menu_context():
    """Fetches up to 50 existing sales items."""
    items = frappe.get_all("Item", fields=["item_name", "standard_rate as price", "item_group"], filters={"is_sales_item": 1}, limit=50)
    return {"items": items, "tax_calculation": "Inclusive"}

@frappe.whitelist(allow_guest=True)
def get_printer_context():
    """Fetches existing printer configuration."""
    printers = frappe.get_all("URY Printer", fields=["*"], limit=1)
    return printers[0] if printers else {}

@frappe.whitelist(allow_guest=True)
def setup_printer(printer_name, server_ip, port, bill=True):
    """Configures a URY Printer."""
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

@frappe.whitelist(allow_guest=True)
def get_room_context():
    """Fetches existing dining rooms."""
    rooms = frappe.get_all("URY Room", fields=["name", "room_name"])
    return {"rooms": rooms}

@frappe.whitelist(allow_guest=True)
def setup_room(rooms):
    """Creates multiple URY Rooms."""
    for room in rooms:
        name = room.get('name') or room.get('room_name')
        if name and not frappe.db.exists("URY Room", name):
            doc = frappe.new_doc("URY Room")
            doc.room_name = name
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist(allow_guest=True)
def get_table_context():
    """Fetches existing rooms and tables."""
    rooms = frappe.get_all("URY Room", pluck="name")
    tables = frappe.get_all("URY Table", fields=["*"])
    return {"rooms": rooms, "tables": tables}

@frappe.whitelist(allow_guest=True)
def setup_table(tables):
    """Creates multiple URY Tables."""
    for table in tables:
        name = table.get('name') or table.get('table_name')
        if name and not frappe.db.exists("URY Table", name):
            doc = frappe.new_doc("URY Table")
            doc.table_name = name
            doc.restaurant_room = table.get('room') or table.get('restaurant_room')
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist(allow_guest=True)
def get_mop_context():
    """Fetches active Modes of Payment."""
    mops = frappe.get_all("Mode of Payment", fields=["name", "type"])
    return {"payment_methods": mops or [{"name": "Cash", "type": "Cash"}]}

@frappe.whitelist(allow_guest=True)
def setup_mop(payments):
    """Creates missing Modes of Payment."""
    for mop in payments:
        name = mop.get("name")
        if name and not frappe.db.exists("Mode of Payment", name):
            doc = frappe.new_doc("Mode of Payment")
            doc.mode_of_payment = name
            doc.type = mop.get("type") or "Cash"
            doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist(allow_guest=True)
def get_branch_context():
    """Fetches existing branch details."""
    branches = frappe.get_all("Branch", fields=["*"], limit=1)
    return branches[0] if branches else {}

@frappe.whitelist(allow_guest=True)
def setup_branch(branch_name, **kwargs):
    """Creates a new Branch."""
    if branch_name and not frappe.db.exists("Branch", branch_name):
        doc = frappe.new_doc("Branch")
        doc.branch = branch_name
        doc.append("user", {"user": frappe.session.user})
        
        # Safely map any additional fields provided by frontend (phone, email, etc.)
        for key, value in kwargs.items():
            if hasattr(doc, key):
                doc.set(key, value)
                
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist(allow_guest=True)
def get_restaurant_context():
    """Fetches existing restaurant profile."""
    res = frappe.get_all("URY Restaurant", fields=["*"], limit=1)
    return res[0] if res else {}

@frappe.whitelist(allow_guest=True)
def setup_restaurant(restaurant_name, tagline="", **kwargs):
    """Creates a new URY Restaurant profile."""
    if restaurant_name and not frappe.db.exists("URY Restaurant", restaurant_name):
        doc = frappe.new_doc("URY Restaurant")
        doc.name = restaurant_name
        
        # Map fields if they exist
        for key, value in kwargs.items():
            if hasattr(doc, key):
                doc.set(key, value)
                
        doc.flags.ignore_mandatory = True
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    return {"status": "success"}

@frappe.whitelist(allow_guest=True)
def get_user_management_context():
    """Fetches current system users for the management wizard."""
    users = frappe.get_all("User", fields=["name", "full_name", "email"], filters={"enabled": 1, "user_type": "System User"})
    return {"roles": ["Cashier", "Manager", "Admin"], "existing_users": users}

@frappe.whitelist(allow_guest=True)
def setup_user_management(users):
    """Creates POS-specific users with assigned roles."""
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

@frappe.whitelist(allow_guest=True)
def get_user_context():
    """Fetches context for the final user setup summary."""
    users = frappe.get_all("User", fields=["name", "full_name", "email"], filters={"enabled": 1, "name": ["not in", ["Administrator", "Guest"]]})
    return {"users": users, "roles": ["Cashier", "Manager", "Admin"]}

@frappe.whitelist(allow_guest=True)
def get_admin_stats():
    """Returns real-time or default statistics for the POS admin dashboard."""
    stats = [
        {"title": _("Total Revenue"), "value": "₹0.00", "change": "+0%", "trend": "up"},
        {"title": _("Active Orders"), "value": "0", "change": "+0", "trend": "up"},
        {"title": _("Total Customers"), "value": "0", "change": "+0", "trend": "neutral"},
        {"title": _("Top Items"), "value": "0", "change": "+0", "trend": "up"}
    ]
    
    try:
        stats[1]["value"] = str(frappe.db.count("URY POS Invoice", {"docstatus": 1}))
        stats[2]["value"] = str(frappe.db.count("Customer"))
        stats[3]["value"] = str(frappe.db.count("Item", {"is_sales_item": 1}))
    except Exception as e:
        frappe.log_error(title="Failed to fetch admin stats", message=str(e))

    revenue_data = [
        {"name": "Mon", "value": 0}, {"name": "Tue", "value": 0}, {"name": "Wed", "value": 0},
        {"name": "Thu", "value": 0}, {"name": "Fri", "value": 0}, {"name": "Sat", "value": 0},
        {"name": "Sun", "value": 0},
    ]

    pie_data = [
        {"name": _("Dine-in"), "value": 0, "color": "#8884d8"},
        {"name": _("Takeaway"), "value": 0, "color": "#82ca9d"},
        {"name": _("Delivery"), "value": 0, "color": "#ffc658"},
    ]
    
    return {
        "stats": stats,
        "revenueData": revenue_data,
        "pieData": pie_data,
        "popularItems": []
    }

def create_demo_company():
    """
    Creates demo company using ERPNext's official logic.
    Safeguarded against duplicate creation.
    """
    companies = frappe.db.get_all("Company")
    if not companies:
        frappe.throw(_("No base company exists to duplicate."))
        
    company_name = companies[0].name
    company_doc = frappe.get_doc("Company", company_name)
    
    demo_name = f"{company_doc.company_name} (Demo)"
    if frappe.db.exists("Company", demo_name):
        return demo_name
        
    demo_company = frappe.new_doc("Company")
    demo_company.company_name = demo_name
    demo_company.abbr = f"{company_doc.abbr}D"
    demo_company.enable_perpetual_inventory = 1
    demo_company.default_currency = company_doc.default_currency
    demo_company.country = company_doc.country
    demo_company.chart_of_accounts_based_on = "Standard Template"
    demo_company.chart_of_accounts = company_doc.chart_of_accounts
    demo_company.insert(ignore_permissions=True)
    
    frappe.db.set_single_value("Global Defaults", "demo_company", demo_company.name)
    frappe.db.set_default("company", demo_company.name)
    
    # Create default bank account (ERPNext internal API)
    bank_account = create_bank_account(
        {"company_name": demo_company.name},
        demo=True,
    )
    
    frappe.db.set_value(
        "Company",
        demo_company.name,
        "default_bank_account",
        bank_account.name,
    )
    
    frappe.db.commit()
    return demo_company.name