require "test_helper"

class LedgerEntryTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(
      email: "ledgertest@example.com",
      password: "password123",
      name: "Ledger Test User"
    )
    @plan = Plan.create!(
      user: @user,
      name: "Test Plan",
      birth_date: "1990-01-15",
      retirement_age: 65
    )
    @entity = Entity.create!(
      plan: @plan,
      name: "Test Account",
      entity_type: "account",
      template_key: "savings"
    )
  end

  test "valid entry saves" do
    entry = LedgerEntry.new(
      entity: @entity,
      day: 19724,
      amount: 10000
    )
    assert entry.save
  end

  test "day must be integer" do
    entry = LedgerEntry.new(entity: @entity)
    assert_not entry.valid?
    assert_includes entry.errors[:day], "can't be blank"

    entry.day = "not a number"
    assert_not entry.valid?
    assert_includes entry.errors[:day], "is not a number"

    entry.day = 19724
    assert entry.valid?
  end

  test "chronological scope orders by day" do
    LedgerEntry.create!(entity: @entity, day: 19800, amount: 300)
    LedgerEntry.create!(entity: @entity, day: 19700, amount: 100)
    LedgerEntry.create!(entity: @entity, day: 19750, amount: 200)

    entries = @entity.ledger_entries.chronological
    days = entries.pluck(:day)

    assert_equal [ 19700, 19750, 19800 ], days
  end
end
