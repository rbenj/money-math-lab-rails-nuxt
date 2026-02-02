require "test_helper"

class PlanTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(
      email: "plantest@example.com",
      password: "password123",
      name: "Plan Test User"
    )
  end

  test "valid plan saves" do
    plan = Plan.new(
      user: @user,
      name: "My Retirement Plan",
      birth_date: "1990-01-15",
      retirement_age: 65
    )
    assert plan.save
  end

  test "required fields validated" do
    plan = Plan.new(user: @user)
    assert_not plan.valid?
    assert_includes plan.errors[:name], "can't be blank"
    assert_includes plan.errors[:birth_date], "can't be blank"
    assert_includes plan.errors[:retirement_age], "can't be blank"
  end

  test "retirement age must be integer between 1 and 250" do
    plan = Plan.new(
      user: @user,
      name: "Test Plan",
      birth_date: "1990-01-15"
    )

    # Too low
    plan.retirement_age = 0
    assert_not plan.valid?
    assert_includes plan.errors[:retirement_age], "must be greater than or equal to 1"

    # Too high
    plan.retirement_age = 251
    assert_not plan.valid?
    assert_includes plan.errors[:retirement_age], "must be less than or equal to 250"

    # Non-integer
    plan.retirement_age = "not a number"
    assert_not plan.valid?
    assert_includes plan.errors[:retirement_age], "is not a number"

    # Valid
    plan.retirement_age = 65
    assert plan.valid?
  end
end
