require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid user saves" do
    user = User.new(
      email: "test@example.com",
      password: "password123",
      name: "Test User"
    )
    assert user.save
  end

  test "email uniqueness enforced" do
    User.create!(
      email: "duplicate@example.com",
      password: "password123",
      name: "First User"
    )

    duplicate = User.new(
      email: "duplicate@example.com",
      password: "password123",
      name: "Second User"
    )
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:email], "has already been taken"
  end

  test "invalid email format rejected" do
    user = User.new(
      email: "not-an-email",
      password: "password123",
      name: "Test User"
    )
    assert_not user.valid?
    assert_includes user.errors[:email], "is invalid"
  end
end
