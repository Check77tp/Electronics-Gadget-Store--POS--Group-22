# Detailed Use Cases — Elaboration Iteration 1 (≈30%)

---

## UC1: Process Sale
**Scenario:** A cashier processes a customer's purchase.  
**Triggering event:** Customer brings items for purchase.  
**Actors:** Cashier  
**Related use cases:** Generate Receipt, Modify Transaction, Apply Tax  
**Stakeholders:** Owner, Cashier, Customer  
**Preconditions:** Cashier must be logged in.  
**Postconditions:** Sale transaction is completed and recorded.  

**Main flow:**
| Actor | System |
|---|---|
| 1. Scans item | 1.1 Display item description |
| 2. Enters quantity | 1.2 Update running total |
| 3. Confirms sale | 1.3 Process payment |
| | 1.4 Record transaction |

**Exception conditions:** Item not found; payment failure.

---

## UC2: Generate Receipt
**Scenario:** A receipt is generated after a sale.  
**Triggering event:** Sale transaction is completed.  
**Actors:** Cashier  
**Related use cases:** Process Sale  
**Stakeholders:** Customer, Cashier  
**Preconditions:** Transaction must be completed.  
**Postconditions:** Receipt is generated and provided to the customer.  

**Main flow:**
| Actor | System |
|---|---|
| 1. Requests receipt | 1.1 Generate receipt |
| 2. Chooses print | 1.2 Print receipt |

**Exception conditions:** Printer failure.

---

## UC3: Cancel Transaction
**Scenario:** Cashier cancels an ongoing sale.  
**Triggering event:** Cashier decides to cancel the transaction.  
**Actors:** Cashier  
**Related use cases:** Process Sale  
**Stakeholders:** Cashier, Customer  
**Preconditions:** Transaction must be active.  
**Postconditions:** Transaction is canceled and cleared.  

**Main flow:**
| Actor | System |
|---|---|
| 1. Selects cancel option | 1.1 Prompt for confirmation |
| 2. Confirms cancellation | 1.2 Cancel transaction |

**Exception conditions:** Cancellation not confirmed (transaction remains active).

---

## UC4: Modify Transaction
**Scenario:** Cashier modifies items in a transaction.  
**Triggering event:** Need to add or remove an item.  
**Actors:** Cashier  
**Related use cases:** Process Sale  
**Stakeholders:** Cashier, Customer  
**Preconditions:** Transaction must be active.  
**Postconditions:** Transaction is updated.  

**Main flow:**
| Actor | System |
|---|---|
| 1. Adds or removes item | 1.1 Update item list |
| 2. Changes quantity | 1.2 Recalculate total |

**Exception conditions:** Item not found.

---

## UC5: Search Product
**Scenario:** Cashier searches for a product.  
**Triggering event:** Cashier needs product information.  
**Actors:** Cashier  
**Related use cases:** View Product Details  
**Stakeholders:** Cashier  
**Preconditions:** System must be operational.  
**Postconditions:** Matching products are displayed.  

**Main flow:**
| Actor | System |
|---|---|
| 1. Enters search criteria | 1.1 Search database |
| 2. Submits search | 1.2 Display results |

**Exception conditions:** Product not found.

---

## UC6: View Product Details
**Scenario:** Cashier views product information.  
**Triggering event:** Cashier selects a product.  
**Actors:** Cashier  
**Related use cases:** Search Product  
**Stakeholders:** Cashier  
**Preconditions:** Product must exist.  
**Postconditions:** Product details are displayed.  

**Main flow:**
| Actor | System |
|---|---|
| 1. Selects product | 1.1 Retrieve product details |
| | 1.2 Display price and stock |

**Exception conditions:** Product not available.

---

## UC7: Apply Discount
**Scenario:** A discount is applied to a transaction.  
**Triggering event:** Cashier chooses to apply a discount.  
**Actors:** Cashier  
**Related use cases:** Process Sale, Modify Transaction  
**Stakeholders:** Administrator, Cashier, Customer  
**Preconditions:** Transaction must be active; discount rules must exist.  
**Postconditions:** Discount is applied and total amount is updated.  

**Main flow:**
| Actor | System |
|---|---|
| 1. Selects apply discount | 1.1 Prompt for discount type |
| 2. Enters discount value | 1.2 Validate discount |
| | 1.3 Calculate discount amount |
| | 1.4 Update and display new total |

**Exception conditions:** Invalid discount value.

---

## UC8: Apply Tax
**Scenario:** Tax is applied to a sale transaction.  
**Triggering event:** Cashier processes a sale requiring tax.  
**Actors:** Cashier  
**Related use cases:** Process Sale  
**Stakeholders:** Cashier, Customer, Tax Authority  
**Preconditions:** Transaction must be active; tax rates must be configured in the system.  
**Postconditions:** Tax is added to the total transaction amount.  

**Main flow:**
| Actor | System |
|---|---|
| 1. Proceeds with sale | 1.1 Retrieve tax rate |
| | 1.2 Calculate tax amount |
| | 1.3 Add tax to total, display updated total |

**Exception conditions:** Tax rate not configured.


---

## UC9: Manage Expenses
**Scenario:** Administrator records and manages business expenses.  
**Triggering event:** Administrator wants to add or view expenses.  
**Actors:** Administrator  
**Related use cases:** View Sales Report  
**Stakeholders:** Administrator  
**Preconditions:** Administrator must be logged in.  
**Postconditions:** Expense records are created, updated, or viewed.  

**Main flow:**
| Actor | System |
|---|---|
| 1. Selects expense option | 1.1 Display expense menu |
| 2. Enters expense details | 1.2 Validate input |
| 3. Saves expense | 1.3 Store expense record |
| 4. Views expenses | 1.4 Retrieve and display expense list |

**Exception conditions:** Invalid expense details.
