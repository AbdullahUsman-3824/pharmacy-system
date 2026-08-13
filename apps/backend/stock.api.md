# Stock Module API

Base URL

```
/stocks
```

---

# Stock Voucher

A Stock Voucher represents either:

- Opening Stock
- Purchase

Each voucher contains one or more stock items.

---

## Create Stock Voucher

### POST

```
POST /stocks/vouchers
```

### Request

```json
{
  "type": "PURCHASE",
  "distributorId": "uuid",
  "voucherDate": "2026-07-15T00:00:00.000Z",
  "remarks": "Invoice #548",

  "items": [
    {
      "productId": "uuid",

      "batchNumber": "A12345",

      "expiryDate": "2027-12-31T00:00:00.000Z",

      "quantity": 100,

      "freeQuantity": 5,

      "purchaseRate": 90,

      "saleRate": 120,

      "grossAmount": 9000,

      "discountPercent": 5,

      "discountAmount": 450,

      "taxPercent": 3,

      "taxAmount": 256.5,

      "netAmount": 8806.5
    }
  ]
}
```

---

### Success Response

```json
{
  "id": "uuid",

  "voucherNumber": "PUR-000001",

  "type": "PURCHASE",

  "date": "2026-07-15T00:00:00.000Z",

  "distributor": {
    "id": "uuid",
    "name": "ABC Pharma"
  },

  "grossAmount": 9000,

  "discountAmount": 450,

  "taxAmount": 256.5,

  "netAmount": 8806.5,

  "items": [
    {
      "id": "uuid",

      "product": {
        "id": "uuid",
        "name": "Panadol"
      },

      "batch": {
        "id": "uuid",
        "batchNumber": "A12345",
        "expiryDate": "2027-12-31T00:00:00.000Z"
      },

      "quantity": 100,

      "freeQuantity": 5,

      "purchaseRate": 90,

      "saleRate": 120,

      "grossAmount": 9000,

      "discountAmount": 450,

      "taxAmount": 256.5,

      "netAmount": 8806.5
    }
  ],

  "createdAt": "2026-07-15T10:15:20.000Z"
}
```

---

# Get All Stock Vouchers

### GET

```
GET /stocks/vouchers
```

---

### Response

```json
[
  {
    "id": "uuid",

    "voucherNumber": "PUR-000001",

    "type": "PURCHASE",

    "date": "2026-07-15T00:00:00.000Z",

    "distributor": {
      "id": "uuid",
      "name": "ABC Pharma"
    },

    "grossAmount": 9000,

    "discountAmount": 450,

    "taxAmount": 256.5,

    "netAmount": 8806.5,

    "createdAt": "2026-07-15T10:15:20.000Z"
  }
]
```

---

# Product Stock

Returns current stock grouped by batches.

---

## GET

```
GET /stocks/products/:productId/stock
```

Example

```
GET /stocks/products/9d2d5b45-82c4-4fb1-9475-4b86f02baf42/stock
```

---

### Response

```json
{
  "productId": "uuid",

  "totalQuantity": 145,

  "batches": [
    {
      "batchId": "uuid",

      "batchNumber": "A12345",

      "expiryDate": "2027-12-31T00:00:00.000Z",

      "currentQuantity": 80,

      "purchaseRate": 90,

      "saleRate": 120
    },
    {
      "batchId": "uuid",

      "batchNumber": "B54221",

      "expiryDate": "2028-04-30T00:00:00.000Z",

      "currentQuantity": 65,

      "purchaseRate": 95,

      "saleRate": 125
    }
  ]
}
```

---

# Voucher Types

```text
OPENING
PURCHASE
```

---

# Business Rules

## Opening Voucher

- Distributor is optional.
- Creates a new batch if one does not already exist.
- Updates current stock.
- Updates opening quantity for newly created batches.

---

## Purchase Voucher

- Distributor is required.
- Creates a new batch if one does not already exist.
- Otherwise increases stock in the existing batch.
- Updates the Product's default purchase and sale rates.
- Stores purchase and sale rate snapshots on each voucher item.

---

# Batch Selection

Frontend does **NOT** ask the user to select a batch while creating stock.

The backend:

- finds an existing batch by
  - product
  - batch number
  - expiry
- creates one if it does not exist
- links the voucher item to that batch

---

# Sale Module

The Sale module will **NOT** ask the cashier for a batch number.

Workflow:

1. Cashier searches or scans a product.
2. Backend automatically selects the FEFO batch.
3. UI displays the selected batch.
4. Cashier can optionally change the batch.
5. Sale stores the selected `batchId`.
