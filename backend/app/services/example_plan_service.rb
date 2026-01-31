# frozen_string_literal: true

# Service to populate a plan with example/demo entities
class ExamplePlanService
  PLAN_START_YEAR = 2023
  USER_AGE = 30
  RETIREMENT_AGE = 65

  def initialize(plan)
    @plan = plan
    @entity_id_map = {}
  end

  def call
    create_entities
    update_entity_references
  end

  private

  def plan_start_day
    @plan_start_day ||= date_to_epoch_day(Date.new(PLAN_START_YEAR, 1, 1))
  end

  def house_purchase_day
    @house_purchase_day ||= date_to_epoch_day(Date.new(PLAN_START_YEAR, 3, 1))
  end

  def retirement_day
    @retirement_day ||= date_to_epoch_day(Date.new(PLAN_START_YEAR + RETIREMENT_AGE - USER_AGE, 1, 1))
  end

  def date_to_epoch_day(date)
    (date - Date.new(1970, 1, 1)).to_i
  end

  def monthly_schedule(days_of_month, start_date, end_date = nil)
    schedule = {
      type: "monthly",
      days_of_month: days_of_month,
      start_date: start_date.iso8601
    }
    schedule[:end_date] = end_date.iso8601 if end_date
    schedule
  end

  def yearly_schedule(start_date)
    {
      type: "yearly",
      start_date: start_date.iso8601
    }
  end

  def create_entities
    example_entities.each do |attrs|
      temp_id = attrs.delete(:temp_id)
      entity = @plan.entities.create!(attrs)
      @entity_id_map[temp_id] = entity.id if temp_id
    end
  end

  def update_entity_references
    @plan.entities.find_each do |entity|
      updates = {}
      data = entity.data&.dup || {}
      needs_update = false

      # Update parent_id reference
      if entity.data&.dig("temp_parent_id")
        real_parent_id = @entity_id_map[entity.data["temp_parent_id"]]
        if real_parent_id
          updates[:parent_id] = real_parent_id
          needs_update = true
        end
        data.delete("temp_parent_id")
      end

      # Update targetEntityId reference
      if data["target_entity_id"].is_a?(String) && @entity_id_map[data["target_entity_id"]]
        data["target_entity_id"] = @entity_id_map[data["target_entity_id"]]
        needs_update = true
      end

      # Update sourceEntityId reference
      if data["source_entity_id"].is_a?(String) && @entity_id_map[data["source_entity_id"]]
        data["source_entity_id"] = @entity_id_map[data["source_entity_id"]]
        needs_update = true
      end

      # Update paymentSourceEntityId reference
      if data["payment_source_entity_id"].is_a?(String) && @entity_id_map[data["payment_source_entity_id"]]
        data["payment_source_entity_id"] = @entity_id_map[data["payment_source_entity_id"]]
        needs_update = true
      end

      if needs_update
        updates[:data] = data
        entity.update!(updates)
      end
    end
  end

  def example_entities
    plan_start_date = Date.new(PLAN_START_YEAR, 1, 1)
    house_purchase_date = Date.new(PLAN_START_YEAR, 3, 1)
    retirement_date = Date.new(PLAN_START_YEAR + RETIREMENT_AGE - USER_AGE, 1, 1)

    [
      # Income entities
      {
        temp_id: "job",
        name: "Job",
        entity_type: "income",
        template_key: "job",
        data: {
          growth_rate: 0.025,
          schedule: monthly_schedule([ 1, 15 ], plan_start_date, retirement_date),
          target_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: plan_start_day, amount: 3900 } ]
      },
      {
        temp_id: "job-spouse",
        name: "Job (Spouse)",
        entity_type: "income",
        template_key: "job",
        data: {
          growth_rate: 0.025,
          schedule: monthly_schedule([ 1, 15 ], plan_start_date, retirement_date),
          target_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: plan_start_day, amount: 3200 } ]
      },
      {
        temp_id: "social-security",
        name: "Social Security",
        entity_type: "income",
        template_key: "social-security",
        data: {
          growth_rate: 0.02,
          schedule: monthly_schedule([ 1 ], retirement_date),
          target_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: retirement_day, amount: 2100 } ]
      },
      {
        temp_id: "social-security-spouse",
        name: "Social Security (Spouse)",
        entity_type: "income",
        template_key: "social-security",
        data: {
          growth_rate: 0.02,
          schedule: monthly_schedule([ 1 ], retirement_date),
          target_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: retirement_day, amount: 1600 } ]
      },

      # Account entities
      {
        temp_id: "checking",
        name: "Checking",
        entity_type: "account",
        template_key: "checking",
        data: { growth_rate: 0.005 },
        ledger_entries_attributes: [ { day: plan_start_day, amount: 2500 } ]
      },
      {
        temp_id: "savings",
        name: "Savings",
        entity_type: "account",
        template_key: "savings",
        data: { growth_rate: 0.035 },
        ledger_entries_attributes: [ { day: plan_start_day, amount: 8000 } ]
      },
      {
        temp_id: "brokerage",
        name: "Brokerage",
        entity_type: "account",
        template_key: "brokerage",
        data: { growth_rate: 0 },
        ledger_entries_attributes: [ { day: plan_start_day, amount: 0 } ]
      },

      # Holding entities (stocks/ETFs)
      {
        temp_id: "aapl",
        name: "AAPL",
        entity_type: "holding",
        template_key: "stock",
        data: { symbol: "AAPL", growth_rate: 0.10, temp_parent_id: "brokerage" },
        ledger_entries_attributes: [
          { day: plan_start_day, share_quantity: 5, share_price: 130 },
          { day: date_to_epoch_day(Date.new(PLAN_START_YEAR, 7, 1)), share_quantity: 8, share_price: 185 },
          { day: date_to_epoch_day(Date.new(PLAN_START_YEAR + 1, 1, 1)), share_quantity: 6, share_price: 195 }
        ]
      },
      {
        temp_id: "msft",
        name: "MSFT",
        entity_type: "holding",
        template_key: "stock",
        data: { symbol: "MSFT", growth_rate: 0.09, temp_parent_id: "brokerage" },
        ledger_entries_attributes: [
          { day: plan_start_day, share_quantity: 4, share_price: 240 },
          { day: date_to_epoch_day(Date.new(PLAN_START_YEAR, 9, 1)), share_quantity: 5, share_price: 330 }
        ]
      },
      {
        temp_id: "goog",
        name: "GOOG",
        entity_type: "holding",
        template_key: "stock",
        data: { symbol: "GOOG", growth_rate: 0.11, temp_parent_id: "brokerage" },
        ledger_entries_attributes: [
          { day: date_to_epoch_day(Date.new(PLAN_START_YEAR, 3, 1)), share_quantity: 10, share_price: 105 }
        ]
      },
      {
        temp_id: "vti",
        name: "VTI",
        entity_type: "holding",
        template_key: "etf",
        data: { symbol: "VTI", growth_rate: 0.08, temp_parent_id: "brokerage" },
        ledger_entries_attributes: [
          { day: plan_start_day, share_quantity: 24, share_price: 200 },
          { day: date_to_epoch_day(Date.new(PLAN_START_YEAR + 1, 1, 1)), share_quantity: 15, share_price: 235 }
        ]
      },
      {
        temp_id: "vxus",
        name: "VXUS",
        entity_type: "holding",
        template_key: "etf",
        data: { symbol: "VXUS", growth_rate: 0.07, temp_parent_id: "brokerage" },
        ledger_entries_attributes: [
          { day: date_to_epoch_day(Date.new(PLAN_START_YEAR, 6, 1)), share_quantity: 40, share_price: 58 }
        ]
      },
      {
        temp_id: "prrsx",
        name: "PRRSX",
        entity_type: "holding",
        template_key: "mutual-fund",
        data: { symbol: "PRRSX", growth_rate: 0.065, temp_parent_id: "brokerage" },
        ledger_entries_attributes: [ { day: plan_start_day, share_quantity: 50, share_price: 42 } ]
      },

      # Possession entities
      {
        temp_id: "house",
        name: "House",
        entity_type: "possession",
        template_key: "house",
        data: { growth_rate: 0.03 },
        ledger_entries_attributes: [ { day: house_purchase_day, amount: 385_000 } ]
      },
      {
        temp_id: "car",
        name: "Car",
        entity_type: "possession",
        template_key: "vehicle",
        data: { growth_rate: -0.12 },
        ledger_entries_attributes: [ { day: plan_start_day, amount: 59_000 } ]
      },

      # Debt entities
      {
        temp_id: "mortgage",
        name: "Mortgage",
        entity_type: "debt",
        template_key: "mortgage",
        data: {
          interest_rate: 0.072,
          payment_amount: 2650,
          payment_schedule: monthly_schedule([ 1 ], house_purchase_date),
          payment_source_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: house_purchase_day, amount: -388_000 } ]
      },
      {
        temp_id: "car-financing",
        name: "Car Financing",
        entity_type: "debt",
        template_key: "auto-loan",
        data: {
          interest_rate: 0.068,
          payment_amount: 625,
          payment_schedule: monthly_schedule([ 10 ], plan_start_date),
          payment_source_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: plan_start_day, amount: -48_000 } ]
      },
      {
        temp_id: "student-loans",
        name: "Student Loans",
        entity_type: "debt",
        template_key: "student-loan",
        data: {
          interest_rate: 0.058,
          payment_amount: 520,
          payment_schedule: monthly_schedule([ 5 ], plan_start_date),
          payment_source_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: plan_start_day, amount: -87_000 } ]
      },

      # Expense entities
      {
        temp_id: "bills",
        name: "Bills",
        entity_type: "expense",
        template_key: "bills",
        data: {
          growth_rate: 0.04,
          schedule: monthly_schedule([ 5 ], plan_start_date),
          source_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: plan_start_day, amount: 450 } ]
      },
      {
        temp_id: "medical",
        name: "Medical",
        entity_type: "expense",
        template_key: "medical",
        data: {
          growth_rate: 0.055,
          schedule: monthly_schedule([ 1 ], plan_start_date),
          source_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: plan_start_day, amount: 680 } ]
      },
      {
        temp_id: "spending",
        name: "Spending",
        entity_type: "expense",
        template_key: "spending",
        data: {
          growth_rate: 0.03,
          schedule: monthly_schedule([ 1 ], plan_start_date),
          source_entity_id: "checking"
        },
        ledger_entries_attributes: [
          { day: plan_start_day, amount: 6200 },
          { day: retirement_day, amount: 3600 }
        ]
      },
      {
        temp_id: "vacation",
        name: "Vacation",
        entity_type: "expense",
        template_key: "vacation",
        data: {
          growth_rate: 0.035,
          schedule: yearly_schedule(Date.new(PLAN_START_YEAR, 7, 1)),
          source_entity_id: "checking"
        },
        ledger_entries_attributes: [ { day: date_to_epoch_day(Date.new(PLAN_START_YEAR, 7, 1)), amount: 8500 } ]
      }
    ]
  end
end
