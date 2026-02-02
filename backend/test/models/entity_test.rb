require "test_helper"

class EntityTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(
      email: "entitytest@example.com",
      password: "password123",
      name: "Entity Test User"
    )
    @plan = Plan.create!(
      user: @user,
      name: "Test Plan",
      birth_date: "1990-01-15",
      retirement_age: 65
    )
  end

  test "valid entity saves" do
    entity = Entity.new(
      plan: @plan,
      name: "Savings Account",
      entity_type: "account",
      template_key: "savings"
    )
    assert entity.save
  end

  test "entity type whitelist enforced" do
    entity = Entity.new(
      plan: @plan,
      name: "Invalid Entity",
      entity_type: "invalid_type",
      template_key: "test"
    )
    assert_not entity.valid?
    assert_includes entity.errors[:entity_type], "is not included in the list"

    # Valid types work
    Entity::VALID_TYPES.each do |valid_type|
      entity.entity_type = valid_type
      entity.valid?
      assert_not entity.errors[:entity_type].any?, "#{valid_type} should be valid"
    end
  end

  test "required fields validated" do
    entity = Entity.new(plan: @plan)
    assert_not entity.valid?
    assert_includes entity.errors[:name], "can't be blank"
    assert_includes entity.errors[:entity_type], "can't be blank"
    assert_includes entity.errors[:template_key], "can't be blank"
  end
end
