import frappe

def print_branch_meta():
    meta = frappe.get_meta("Branch")
    print([(f.fieldname, f.label) for f in meta.fields])
    print(f"Autoname: {meta.autoname}")
