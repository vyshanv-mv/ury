import frappe

def test():
    try:
        doc = frappe.new_doc("URY Restaurant")
        doc.name = "Test Restaurant"
        doc.flags.ignore_mandatory = True
        doc.insert(ignore_permissions=True)
        print("Success")
    except Exception as e:
        print("Error:", e)
