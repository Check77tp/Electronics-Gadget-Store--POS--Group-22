# Detailed Use Cases — Elaboration Iteration 1 (≈30%)

---

## UC1: Process Sale

**SSD:**
```mermaid
sequenceDiagram
    actor Cashier
    participant System as :System
    loop for each item
        Cashier->>System: scanItem(barcode)
        System-->>Cashier: description, runningTotal
        Cashier->>System: enterQuantity(qty)
        System-->>Cashier: updatedRunningTotal
    end
    Cashier->>System: endSale()
    System-->>Cashier: total (incl. tax)
    Cashier->>System: makePayment(amount)
    System-->>Cashier: changeDue, receipt
```

---

## UC2: Generate Receipt

**SSD:**
```mermaid
sequenceDiagram
    actor Cashier
    participant System as :System
    Cashier->>System: requestReceipt()
    System-->>Cashier: receipt
    Cashier->>System: printReceipt()
    System-->>Cashier: printConfirmation
```

---

## UC3: Cancel Transaction

**SSD:**
```mermaid
sequenceDiagram
    actor Cashier
    participant System as :System
    Cashier->>System: selectCancel()
    System-->>Cashier: confirmationPrompt
    Cashier->>System: confirmCancel()
    System-->>Cashier: transactionCleared
```

---

## UC4: Modify Transaction

**SSD:**
```mermaid
sequenceDiagram
    actor Cashier
    participant System as :System
    Cashier->>System: addOrRemoveItem(lineItemID)
    System-->>Cashier: updatedItemList
    Cashier->>System: changeQuantity(lineItemID, qty)
    System-->>Cashier: recalculatedTotal
```

---

## UC5: Search Product

**SSD:**
```mermaid
sequenceDiagram
    actor Cashier
    participant System as :System
    Cashier->>System: searchProduct(criteria)
    System-->>Cashier: matchingProducts[]
```

---

## UC6: View Product Details

**SSD:**
```mermaid
sequenceDiagram
    actor Cashier
    participant System as :System
    Cashier->>System: selectProduct(productID)
    System-->>Cashier: productDetails(price, stock, description)
```

---

## UC7: Apply Discount

**SSD:**
```mermaid
sequenceDiagram
    actor Cashier
    participant System as :System
    Cashier->>System: applyDiscount()
    System-->>Cashier: discountTypePrompt
    Cashier->>System: enterDiscountValue(value)
    System-->>Cashier: validated, newTotal
```

---

## UC8: Apply Tax

**SSD:**
```mermaid
sequenceDiagram
    actor Cashier
    participant System as :System
    Cashier->>System: proceedWithSale()
    System-->>Cashier: updatedTotal (incl. tax)
```

---

## UC9: Manage Expenses

**SSD:**
```mermaid
sequenceDiagram
    actor Administrator
    participant System as :System
    Administrator->>System: selectExpenseOption()
    System-->>Administrator: expenseMenu
    Administrator->>System: enterExpenseDetails(details)
    System-->>Administrator: saved
    Administrator->>System: viewExpenses()
    System-->>Administrator: expenseList
```