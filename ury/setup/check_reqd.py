import frappe

def get_reqd():
    meta = frappe.get_meta('Branch')
    print([(f.fieldname, f.reqd) for f in meta.fields if getattr(f, 'reqd', False)])
