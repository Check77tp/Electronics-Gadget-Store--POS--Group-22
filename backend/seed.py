"""
Seed script -- populates gadgetpos.db with realistic demo data so the system
is demoable (not empty) on first run. Reuses product names/prices/SKUs from
the Google Stitch UI mockups (dashboard_code.html, point_of_sale_terminal_code.html,
inventory_stock_management_code.html, project_management_catalog_code.html)
so the seeded data matches what the screens were designed to show.

Run with: python seed.py   (from the backend/ directory, venv activated)
Safe to re-run: it checks for existing data and skips seeding if present.
"""
from sqlmodel import Session, select

from app.domain.models import (
    Inventory,
    Product,
    ProductCategory,
    Supplier,
    UserAccount,
    UserRole,
    UserStatus,
)
from app.technical_services.auth.security import hash_password
from app.technical_services.logging.logger import log_action
from app.technical_services.persistence.database import engine, init_db


def seed():
    init_db()
    with Session(engine) as session:
        existing_user = session.exec(select(UserAccount)).first()
        if existing_user:
            print("Database already seeded (users exist). Skipping.")
            return

        # --- Users: one of each role, per README Section 7 ---
        users = [
            UserAccount(
                username="admin",
                hashed_password=hash_password("Admin123!"),
                full_name="David Vance",
                email="david.vance@gadgetpos.example",
                phone="+260-97-100-0001",
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
            ),
            UserAccount(
                username="manager",
                hashed_password=hash_password("Manager123!"),
                full_name="Sarah Jenkins",
                email="sarah.jenkins@gadgetpos.example",
                phone="+260-97-100-0002",
                role=UserRole.MANAGER,
                status=UserStatus.ACTIVE,
            ),
            UserAccount(
                username="cashier",
                hashed_password=hash_password("Cashier123!"),
                full_name="Mike Ross",
                email="mike.ross@gadgetpos.example",
                phone="+260-97-100-0003",
                role=UserRole.CASHIER,
                status=UserStatus.ACTIVE,
            ),
            UserAccount(
                username="cashier2",
                hashed_password=hash_password("Cashier123!"),
                full_name="Rita Torres",
                email="rita.torres@gadgetpos.example",
                phone="+260-97-100-0004",
                role=UserRole.CASHIER,
                status=UserStatus.DISABLED,  # demonstrates the "disabled account" UI state
            ),
        ]
        session.add_all(users)
        session.commit()

        # --- Categories ---
        category_names = [
            "Audio & Wearables",
            "Computer Accessories",
            "Power & Cables",
            "Smartphones & Tablets",
            "Storage",
            "Keyboards & Input",
            "Gaming Gear",
        ]
        categories = {name: ProductCategory(name=name) for name in category_names}
        session.add_all(categories.values())
        session.commit()

        # --- Suppliers ---
        suppliers = {
            "Anker US": Supplier(name="Anker US", phone="+1-800-555-0101", email="orders@anker.example", address="Seattle, WA"),
            "Logitech Direct": Supplier(name="Logitech Direct", phone="+1-800-555-0102", email="orders@logitech.example", address="Lausanne, CH"),
            "Sony Distribution": Supplier(name="Sony Distribution", phone="+1-800-555-0103", email="orders@sony.example", address="Tokyo, JP"),
            "Keychron Logistics": Supplier(name="Keychron Logistics", phone="+1-800-555-0104", email="orders@keychron.example", address="Shenzhen, CN"),
            "Apple Distribution": Supplier(name="Apple Distribution", phone="+1-800-555-0105", email="orders@apple.example", address="Cupertino, CA"),
            "Samsung Zambia": Supplier(name="Samsung Zambia", phone="+260-21-555-0106", email="orders@samsung.example", address="Lusaka, ZM"),
            "Belkin Supply Co": Supplier(name="Belkin Supply Co", phone="+1-800-555-0107", email="orders@belkin.example", address="Playa Vista, CA"),
            "Baseus Direct": Supplier(name="Baseus Direct", phone="+86-755-555-0108", email="orders@baseus.example", address="Shenzhen, CN"),
            "SanDisk Distribution": Supplier(name="SanDisk Distribution", phone="+1-800-555-0109", email="orders@sandisk.example", address="Milpitas, CA"),
            "WD Logistics": Supplier(name="WD Logistics", phone="+1-800-555-0110", email="orders@wd.example", address="San Jose, CA"),
        }
        session.add_all(suppliers.values())
        session.commit()

        # --- Product images ---
        # Real product photos from Wikimedia Commons (freely licensed, stable
        # hosting) keyed by SKU, so the POS grid / Products / Inventory tables
        # show an actual picture instead of the generic placeholder icon.
        # Where the exact model/capacity/color isn't on Commons, the closest
        # real photo of the same product line is used instead (noted inline).
        PRODUCT_IMAGES = {
            "PWR-65-ANK": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Anker-PowerPort-40W-5-Port-USB-Ladegeraet.jpg/500px-Anker-PowerPort-40W-5-Port-USB-Ladegeraet.jpg",
            "PWR-ANK-100W-BLK": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Anker-PowerPort-40W-5-Port-USB-Ladegeraet.2.jpg/500px-Anker-PowerPort-40W-5-Port-USB-Ladegeraet.2.jpg",
            "ACC-LOG-MX3S-GR": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Logitech_MX_Master_3S_HS13.jpg/500px-Logitech_MX_Master_3S_HS13.jpg",
            # Sony WH-1000XM3 photo -- XM5 isn't on Commons yet, same over-ear design family.
            "AUD-SNY-XM5": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.jpg/500px-Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.jpg",
            # Keychron K8 -- K2 isn't on Commons, same brand/wireless mechanical keyboard line.
            "ACC-KCH-K2": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Keychron_K8_Non-Backlight_Wireless_Mechanical_Keyboard_%28closeup%29.jpg/500px-Keychron_K8_Non-Backlight_Wireless_Mechanical_Keyboard_%28closeup%29.jpg",
            "KBD-KEY-Q1P-GR": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Keychron_K8_Non-Backlight_Wireless_Mechanical_Keyboard_-_52771896827.jpg/500px-Keychron_K8_Non-Backlight_Wireless_Mechanical_Keyboard_-_52771896827.jpg",
            "TAB-SAM-S9": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Samsung_Galaxy_Tab_S9.png/500px-Samsung_Galaxy_Tab_S9.png",
            "CBL-BLK-2M": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Black_charging_cable_type_USB-C_plugs_04.jpg/500px-Black_charging_cable_type_USB-C_plugs_04.jpg",
            # Baseus-brand USB charger photo -- no Baseus power bank on Commons, same brand.
            "PWR-BAS-20K": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Baseus_USB_chargers-0.jpg/500px-Baseus_USB_chargers-0.jpg",
            # AirPods Pro 3rd-gen case photo -- 2nd gen isn't on Commons, same case design.
            "AUD-APL-APP2": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/AirPods_Pro_3_with_case.jpg/500px-AirPods_Pro_3_with_case.jpg",
            "STR-SND-1TB": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/SanDisk_Extreme_Portable_SSD_-_1TB%2C_USB-C_%2841036158305%29.jpg/500px-SanDisk_Extreme_Portable_SSD_-_1TB%2C_USB-C_%2841036158305%29.jpg",
            # Same SN850X model line, 8TB variant photographed rather than 2TB.
            "STR-WD-2TB": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Western_Digital_SN850X_NVME_solid_state_drive_8TB_front_side.jpg/500px-Western_Digital_SN850X_NVME_solid_state_drive_8TB_front_side.jpg",
            # Samsung T7 Shield -- T9 isn't on Commons, same "Shield" rugged SSD line.
            "STR-SAM-T9-2TB": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/SAMSUNG_PROTABLE_SSD_T7_SHIELD_4TB_LEFT_SIDE.jpg/500px-SAMSUNG_PROTABLE_SSD_T7_SHIELD_4TB_LEFT_SIDE.jpg",
            "KBD-APL-MKBT-SLV": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Apple_Magic_Keyboard_-_US.jpg/500px-Apple_Magic_Keyboard_-_US.jpg",
            # Apple Watch Ultra (Series 3 titanium case) -- Ultra 2 isn't on Commons, same design.
            "AP-WT-UL49": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Apple_Watch_Ultra_Series_3_Natural_Titanium_Case.jpg/500px-Apple_Watch_Ultra_Series_3_Natural_Titanium_Case.jpg",
            "PHN-APL-15P-128": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/IPhone_15_Pro_2024.jpg/500px-IPhone_15_Pro_2024.jpg",
            "PHN-SAM-S24-256": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Samsung_Galaxy_S24%2C_Sperrbildschirm.JPG/500px-Samsung_Galaxy_S24%2C_Sperrbildschirm.JPG",
            # Generic MagSafe charger photo -- no Belkin-branded one on Commons, same accessory type.
            "PWR-BLK-3IN1": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/MagSafe_and_USB-C_Cable_Charger_for_iPhone.jpg/500px-MagSafe_and_USB-C_Cable_Charger_for_iPhone.jpg",
            # Logitech G35 -- G Pro X isn't on Commons, same brand/gaming headset category.
            "GAM-LOG-GPX": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Logitech_G35_side_view.jpg/500px-Logitech_G35_side_view.jpg",
            # Razer DeathAdder Elite -- V3 isn't on Commons, same iconic DeathAdder shape/line.
            "GAM-RZR-DAV3": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Razer_DeathAdder_Elite-front_oblique-ar_16to10-fs_PNr%C2%B00465.jpg/500px-Razer_DeathAdder_Elite-front_oblique-ar_16to10-fs_PNr%C2%B00465.jpg",
        }

        # --- Products (name, brand, sku, barcode, category, supplier, cost, price, stock, reorder) ---
        # Data reused/extended from the Stitch POS Terminal, Inventory, and Product Catalog mockups.
        product_rows = [
            ("Anker 65W GaN Fast Charger", "Anker", "PWR-65-ANK", "7890123456", "Power & Cables", "Anker US", 22.00, 39.99, 42, 15, "Aisle 4, A-11"),
            ("Anker Prime 100W GaN 3-Port", "Anker", "PWR-ANK-100W-BLK", "194644140228", "Power & Cables", "Anker US", 38.00, 74.99, 45, 15, "Aisle 4, A-12"),
            ("Logitech MX Master 3S Wireless Mouse", "Logitech", "ACC-LOG-MX3S-GR", "097855175297", "Computer Accessories", "Logitech Direct", 58.50, 99.99, 14, 10, "Aisle 2, C-02"),
            ("Sony WH-1000XM5 Wireless Headphones", "Sony", "AUD-SNY-XM5", "027242923973", "Audio & Wearables", "Sony Distribution", 210.00, 349.99, 6, 5, "Aisle 1, B-02"),
            ("Keychron K2 Wireless Mechanical Keyboard", "Keychron", "ACC-KCH-K2", "840134710294", "Keyboards & Input", "Keychron Logistics", 52.00, 89.00, 3, 10, "Aisle 2, C-04"),
            ("Keychron Q1 Pro QMK Wireless Keyboard", "Keychron", "KBD-KEY-Q1P-GR", "697266159182", "Keyboards & Input", "Keychron Logistics", 135.00, 199.00, 3, 8, "Aisle 2, C-05"),
            ("Samsung Galaxy Tab S9 128GB Wi-Fi", "Samsung", "TAB-SAM-S9", "887276778401", "Smartphones & Tablets", "Samsung Zambia", 480.00, 699.99, 9, 4, "Display 2"),
            ("Belkin BoostCharge Pro USB-C Cable 2m", "Belkin", "CBL-BLK-2M", "745883832104", "Power & Cables", "Belkin Supply Co", 7.50, 19.99, 65, 20, "Pegboard 3"),
            ("Baseus 20,000mAh 65W Power Bank", "Baseus", "PWR-BAS-20K", "695315629104", "Power & Cables", "Baseus Direct", 31.00, 54.99, 0, 15, "Aisle 4, A-09"),
            ("Apple AirPods Pro (2nd Gen) USB-C", "Apple", "AUD-APL-APP2", "194253397168", "Audio & Wearables", "Apple Distribution", 165.00, 249.00, 18, 8, "Safe Cage 1"),
            ("SanDisk Extreme 1TB Portable SSD", "SanDisk", "STR-SND-1TB", "618279871234", "Storage", "SanDisk Distribution", 78.00, 119.99, 8, 6, "Aisle 3, D-02"),
            ("Western Digital Black SN850X 2TB NVMe", "Western Digital", "STR-WD-2TB", "718037891334", "Storage", "WD Logistics", 85.00, 139.99, 4, 6, "Aisle 3, D-01"),
            ("Samsung T9 Shield SSD 2TB", "Samsung", "STR-SAM-T9-2TB", "887276778402", "Storage", "Samsung Zambia", 145.00, 239.99, 8, 5, "Aisle 3, D-03"),
            ("Apple Magic Keyboard (Touch ID + Numpad)", "Apple", "KBD-APL-MKBT-SLV", "194252544273", "Keyboards & Input", "Apple Distribution", 139.00, 179.00, 0, 6, "Aisle 2, C-08"),
            ("Apple Watch Ultra 2 Alpine Loop", "Apple", "AP-WT-UL49", "194253987654", "Audio & Wearables", "Apple Distribution", 620.00, 799.00, 2, 8, "Safe Cage 1"),
            ("iPhone 15 Pro 128GB", "Apple", "PHN-APL-15P-128", "195949031234", "Smartphones & Tablets", "Apple Distribution", 850.00, 999.00, 11, 5, "Safe Cage 2"),
            ("Samsung Galaxy S24 256GB", "Samsung", "PHN-SAM-S24-256", "887276991234", "Smartphones & Tablets", "Samsung Zambia", 620.00, 799.00, 13, 5, "Safe Cage 2"),
            ("Belkin 3-in-1 MagSafe Wireless Charger", "Belkin", "PWR-BLK-3IN1", "745883845678", "Power & Cables", "Belkin Supply Co", 65.00, 119.99, 16, 6, "Aisle 4, A-14"),
            ("Logitech G Pro X Gaming Headset", "Logitech", "GAM-LOG-GPX", "097855198765", "Gaming Gear", "Logitech Direct", 68.00, 129.99, 12, 6, "Aisle 5, E-02"),
            ("Razer DeathAdder V3 Gaming Mouse", "Razer", "GAM-RZR-DAV3", "811735234567", "Gaming Gear", "Logitech Direct", 42.00, 69.99, 20, 8, "Aisle 5, E-03"),
        ]

        for (
            name, brand, sku, barcode, cat_name, sup_name,
            cost, price, stock, reorder, bin_loc,
        ) in product_rows:
            product = Product(
                sku=sku,
                barcode=barcode,
                name=name,
                brand=brand,
                description=f"{brand} {name} -- reliable, in-demand electronics store stock.",
                cost_price=cost,
                price=price,
                image_url=PRODUCT_IMAGES.get(sku),
                category_id=categories[cat_name].id,
                supplier_id=suppliers[sup_name].id,
            )
            session.add(product)
            session.commit()
            session.refresh(product)

            inv = Inventory(
                product_id=product.id,
                stock_quantity=stock,
                reorder_level=reorder,
                bin_location=bin_loc,
            )
            session.add(inv)
            session.commit()

        log_action("database_seeded", detail=f"{len(product_rows)} products, {len(users)} users")
        print(f"Seeded {len(users)} users, {len(categories)} categories, {len(suppliers)} suppliers, {len(product_rows)} products.")
        print("\nDefault login credentials:")
        print("  Admin:    admin / Admin123!")
        print("  Manager:  manager / Manager123!")
        print("  Cashier:  cashier / Cashier123!")
        print("  Disabled: cashier2 / Cashier123!  (demonstrates the disabled-account error state)")


if __name__ == "__main__":
    seed()
