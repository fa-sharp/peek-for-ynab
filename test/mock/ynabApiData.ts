import type { Account, CategoryGroupWithCategories, Payee } from "ynab";

export const budgets = [
  {
    id: "97b0a016-a8c1-490c-a33c-cc06940d3d80",
    name: "Personal Budget",
    last_modified_on: "2024-01-15T07:55:52Z",
    first_month: "2022-11-01",
    last_month: "2024-01-01",
    date_format: {
      format: "MM/DD/YYYY"
    },
    currency_format: {
      iso_code: "USD",
      example_format: "123,456.78",
      decimal_digits: 2,
      decimal_separator: ".",
      symbol_first: true,
      group_separator: ",",
      currency_symbol: "$",
      display_symbol: true
    }
  },
  {
    id: "9d3d5542-6881-488e-97bf-386d39de9204",
    name: "GBP Budget",
    last_modified_on: "2023-04-15T01:17:09Z",
    first_month: "2022-07-01",
    last_month: "2023-05-01",
    date_format: {
      format: "MM/DD/YYYY"
    },
    currency_format: {
      iso_code: "GBP",
      example_format: "123,456.78",
      decimal_digits: 2,
      decimal_separator: ".",
      symbol_first: true,
      group_separator: ",",
      currency_symbol: "£",
      display_symbol: true
    }
  }
];

export const accounts: Account[] = [
  {
    id: "39c70b03-cf3b-4932-bcd6-5db25884f14d",
    name: "💰 Mutual Funds",
    type: "otherAsset",
    on_budget: false,
    closed: false,
    note: "",
    balance: 16_000_000,
    cleared_balance: 16_000_000,
    uncleared_balance: 0,
    transfer_payee_id: "35764e10-64b2-4ff8-9704-26d171a6197e",
    direct_import_linked: false,
    direct_import_in_error: false,
    last_reconciled_at: "2024-01-16T00:17:31Z",
    debt_interest_rates: {},
    debt_minimum_payments: {},
    debt_escrow_amounts: {},
    deleted: false
  },
  {
    id: "b04cde9d-a0f7-4ed0-bf82-b44a3c4de92e",
    name: "Checking",
    type: "checking",
    on_budget: true,
    closed: false,
    balance: 1000000,
    cleared_balance: 1000000,
    uncleared_balance: 0,
    transfer_payee_id: "471ecaf5-5da8-49ce-9c99-06f45599d1a7",
    direct_import_linked: false,
    direct_import_in_error: false,
    debt_interest_rates: {},
    debt_minimum_payments: {},
    debt_escrow_amounts: {},
    deleted: false
  },
  {
    id: "3857871b-1a41-45b9-81e6-d60ad2d093ba",
    name: "Savings",
    type: "savings",
    on_budget: true,
    closed: false,
    balance: 800000,
    cleared_balance: 800000,
    uncleared_balance: 0,
    transfer_payee_id: "99b65028-2421-4d2f-8ca7-b3cfba1678e1",
    direct_import_linked: false,
    direct_import_in_error: false,
    debt_interest_rates: {},
    debt_minimum_payments: {},
    debt_escrow_amounts: {},
    deleted: false
  },
  {
    id: "509fec7a-f582-4fc7-8fa3-a133d6aae076",
    name: "💳 Amex Blue Cash",
    type: "creditCard",
    on_budget: true,
    closed: false,
    note: "",
    balance: -130000,
    cleared_balance: -130000,
    uncleared_balance: 0,
    transfer_payee_id: "90319ed5-6d0e-42dd-9e83-faeb2ab4523c",
    direct_import_linked: true,
    direct_import_in_error: false,
    last_reconciled_at: "2024-01-18T06:25:54Z",
    debt_interest_rates: {},
    debt_minimum_payments: {},
    debt_escrow_amounts: {},
    deleted: false
  }
];

export const category_groups: CategoryGroupWithCategories[] = [
  {
    id: "c09cccbd-e8c4-48d1-a043-e92331e6827a",
    name: "Internal Master Category",
    hidden: false,
    deleted: false,
    categories: [
      {
        id: "73a1163a-f350-4eca-bb83-70f7f4381839",
        category_group_id: "c09cccbd-e8c4-48d1-a043-e92331e6827a",
        category_group_name: "Internal Master Category",
        name: "Inflow: Ready to Assign",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 1800000,
        goal_target: 0,
        deleted: false
      },
      {
        id: "fd01ea25-415d-4793-a1c5-ea5d9b434b58",
        category_group_id: "c09cccbd-e8c4-48d1-a043-e92331e6827a",
        category_group_name: "Internal Master Category",
        name: "Uncategorized",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 0,
        goal_target: 0,
        deleted: false
      }
    ]
  },
  {
    id: "70e91c44-0cb2-40f5-88c3-22456eff17af",
    name: "Credit Card Payments",
    hidden: false,
    deleted: false,
    categories: [
      {
        id: "929d67dc-28fd-4041-8075-1422e23160c5",
        category_group_id: "70e91c44-0cb2-40f5-88c3-22456eff17af",
        category_group_name: "Credit Card Payments",
        name: "💳 Amex Blue Cash",
        hidden: false,
        original_category_group_id: null,
        note: null,
        budgeted: 109480,
        activity: 26650,
        balance: 130000,
        goal_type: null,
        goal_day: null,
        goal_cadence: null,
        goal_cadence_frequency: null,
        goal_creation_month: null,
        goal_target: 0,
        goal_target_month: null,
        goal_percentage_complete: null,
        goal_months_to_budget: null,
        goal_under_funded: null,
        goal_overall_funded: null,
        goal_overall_left: null,
        deleted: false
      }
    ]
  },
  {
    id: "9227e973-4260-4d29-9943-d75a065feb47",
    name: "Bills",
    hidden: false,
    deleted: false,
    categories: [
      {
        id: "f7aba0bb-cdd3-4e49-a54b-1ba6cea73fcb",
        category_group_id: "9227e973-4260-4d29-9943-d75a065feb47",
        category_group_name: "Bills",
        name: "Rent/Mortgage",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 1000000,
        goal_type: "NEED",
        goal_cadence: 1,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      },
      {
        id: "a9586962-70e1-4251-947c-2bdf6f4d04f9",
        category_group_id: "9227e973-4260-4d29-9943-d75a065feb47",
        category_group_name: "Bills",
        name: "Electric",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 80000,
        goal_type: "NEED",
        goal_day: 15,
        goal_cadence: 1,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      },
      {
        id: "4c0b6d15-07f9-4032-9324-96286cfebdb5",
        category_group_id: "9227e973-4260-4d29-9943-d75a065feb47",
        category_group_name: "Bills",
        name: "Water",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 60000,
        goal_type: "NEED",
        goal_day: 23,
        goal_cadence: 1,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      },
      {
        id: "e9371eb5-d2f6-4b3a-87cf-151f01253a91",
        category_group_id: "9227e973-4260-4d29-9943-d75a065feb47",
        category_group_name: "Bills",
        name: "Internet",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 60000,
        goal_type: "NEED",
        goal_day: 22,
        goal_cadence: 1,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      },
      {
        id: "b4b8722e-6ac9-4fcf-8b1d-0c5af4859563",
        category_group_id: "9227e973-4260-4d29-9943-d75a065feb47",
        category_group_name: "Bills",
        name: "Cellphone",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 0,
        goal_type: "NEED",
        goal_day: 22,
        goal_cadence: 1,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      }
    ]
  },
  {
    id: "aa878eb3-b54d-477f-968a-ae22f9b1ddcb",
    name: "Frequent",
    hidden: false,
    deleted: false,
    categories: [
      {
        id: "de6859dd-20ef-49db-85ce-762a58bb92b6",
        category_group_id: "aa878eb3-b54d-477f-968a-ae22f9b1ddcb",
        category_group_name: "Frequent",
        name: "Groceries",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 0,
        goal_type: "NEED",
        goal_day: 6,
        goal_cadence: 2,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      },
      {
        id: "4854168f-c898-4b5c-8e19-18a76c6cc436",
        category_group_id: "aa878eb3-b54d-477f-968a-ae22f9b1ddcb",
        category_group_name: "Frequent",
        name: "Eating Out",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: -50_000,
        goal_type: "NEED",
        goal_day: 6,
        goal_cadence: 2,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      },
      {
        id: "36ead0b7-a541-4342-9a6f-1f5240cb7eeb",
        category_group_id: "aa878eb3-b54d-477f-968a-ae22f9b1ddcb",
        category_group_name: "Frequent",
        name: "Gas",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 0,
        goal_type: "NEED",
        goal_day: 6,
        goal_cadence: 2,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      }
    ]
  },
  {
    id: "d174cf24-6f67-4618-bd7e-32fd5a88989f",
    name: "Non-Monthly",
    hidden: false,
    deleted: false,
    categories: [
      {
        id: "19138540-fde1-416a-8172-60e875914fbd",
        category_group_id: "d174cf24-6f67-4618-bd7e-32fd5a88989f",
        category_group_name: "Non-Monthly",
        name: "🛒 Shopping",
        hidden: false,
        budgeted: -50000,
        activity: 0,
        balance: 50000,
        goal_target: 0,
        deleted: false
      },
      {
        id: "54b3aed3-278d-4270-b0d7-7e4130b806cc",
        category_group_id: "d174cf24-6f67-4618-bd7e-32fd5a88989f",
        category_group_name: "Non-Monthly",
        name: "Home Maintenance",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 0,
        goal_type: "TB",
        goal_target: 0,
        deleted: false
      },
      {
        id: "30d27f2d-fbfc-4dc0-b389-4e45d3b5d7de",
        category_group_id: "d174cf24-6f67-4618-bd7e-32fd5a88989f",
        category_group_name: "Non-Monthly",
        name: "Auto Maintenance",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 0,
        goal_type: "TB",
        goal_target: 0,
        deleted: false
      },
      {
        id: "a4fce314-115c-44ed-ae05-d2cdf62eee03",
        category_group_id: "d174cf24-6f67-4618-bd7e-32fd5a88989f",
        category_group_name: "Non-Monthly",
        name: "🎁 Gifts",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 50000,
        goal_type: "NEED",
        goal_cadence: 13,
        goal_cadence_frequency: 1,
        goal_target: 0,
        goal_target_month: "2022-12-10",
        deleted: false
      }
    ]
  },
  {
    id: "ea9e7210-4910-429a-8077-110d0bcfbf21",
    name: "Goals",
    hidden: false,
    deleted: false,
    categories: [
      {
        id: "bae8b51d-9e15-4bd7-8118-cfc47b9119c8",
        category_group_id: "ea9e7210-4910-429a-8077-110d0bcfbf21",
        category_group_name: "Goals",
        name: "Vacation",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 200000,
        goal_type: "TB",
        goal_target: 0,
        deleted: false
      },
      {
        id: "390d9c3c-c567-4a72-b2a0-dbfb258a5366",
        category_group_id: "ea9e7210-4910-429a-8077-110d0bcfbf21",
        category_group_name: "Goals",
        name: "Education",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 200000,
        goal_type: "TB",
        goal_target: 0,
        deleted: false
      },
      {
        id: "fa23ac8d-dafd-4e02-b2ae-94630fb21340",
        category_group_id: "ea9e7210-4910-429a-8077-110d0bcfbf21",
        category_group_name: "Goals",
        name: "Home Improvement",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 100000,
        goal_type: "TB",
        goal_target: 0,
        deleted: false
      }
    ]
  },
  {
    id: "1fe6e43c-116e-4ef6-b9f5-c03262312cec",
    name: "Quality of Life",
    hidden: false,
    deleted: false,
    categories: [
      {
        id: "d9658cb2-c7d3-4561-b87a-472404d5b36b",
        category_group_id: "1fe6e43c-116e-4ef6-b9f5-c03262312cec",
        category_group_name: "Quality of Life",
        name: "Hobbies",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 0,
        goal_type: "NEED",
        goal_cadence: 1,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      },
      {
        id: "7a65641e-6140-48a1-829f-8191d21fb730",
        category_group_id: "1fe6e43c-116e-4ef6-b9f5-c03262312cec",
        category_group_name: "Quality of Life",
        name: "Entertainment",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 0,
        goal_type: "NEED",
        goal_day: 6,
        goal_cadence: 2,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      },
      {
        id: "65880ef0-3bf7-451c-9340-a1556035df76",
        category_group_id: "1fe6e43c-116e-4ef6-b9f5-c03262312cec",
        category_group_name: "Quality of Life",
        name: "Health & Wellness",
        hidden: false,
        budgeted: 0,
        activity: 0,
        balance: 0,
        goal_type: "NEED",
        goal_cadence: 1,
        goal_cadence_frequency: 1,
        goal_target: 0,
        deleted: false
      }
    ]
  },
  {
    id: "c2867dda-9863-44ec-b25a-6a78d368afee",
    name: "Hidden Categories",
    hidden: false,
    deleted: false,
    categories: []
  }
];

export const payees: Payee[] = [
  {
    id: "3bc99e6e-1359-4997-a3fc-da5564458cbe",
    name: "Manual Balance Adjustment",
    deleted: false
  },
  {
    id: "7dc6ba69-7fb1-4eaf-826c-8dacdba9bf11",
    name: "Reconciliation Balance Adjustment",
    deleted: false
  },
  {
    id: "ea0bc26e-0d77-46eb-b76f-5d8284144a07",
    name: "Starting Balance",
    deleted: false
  },
  {
    id: "471ecaf5-5da8-49ce-9c99-06f45599d1a7",
    name: "Transfer : Checking",
    transfer_account_id: "b04cde9d-a0f7-4ed0-bf82-b44a3c4de92e",
    deleted: false
  },
  {
    id: "99b65028-2421-4d2f-8ca7-b3cfba1678e1",
    name: "Transfer : Savings",
    transfer_account_id: "3857871b-1a41-45b9-81e6-d60ad2d093ba",
    deleted: false
  },
  {
    id: "17920337-4897-4491-88d6-d9eb513b9e6a",
    name: "JetBlue",
    deleted: false
  },
  {
    id: "802f3c17-337f-46db-89e8-272048f344a1",
    name: "JuiceLand",
    deleted: false
  },
  {
    id: "7545921c-5a25-42ca-ae0f-4aa2e114cb34",
    name: "ABC Stores",
    deleted: false
  },
  {
    id: "7805107b-5a41-467b-bc69-a91ab7446423",
    name: "Mr. Tire",
    deleted: false
  }
];
