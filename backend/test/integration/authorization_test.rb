require "test_helper"

class AuthorizationTest < ActionDispatch::IntegrationTest
  setup do
    @alice = User.create!(
      email: "alice@example.com",
      password: "password123",
      name: "Alice"
    )
    @bob = User.create!(
      email: "bob@example.com",
      password: "password123",
      name: "Bob"
    )

    @alice_plan = Plan.create!(
      user: @alice,
      name: "Alice's Plan",
      birth_date: "1990-01-15",
      retirement_age: 65
    )
    @alice_entity = Entity.create!(
      plan: @alice_plan,
      name: "Alice's Account",
      entity_type: "account",
      template_key: "savings"
    )
  end

  test "user cannot access another user's plan" do
    # First verify Alice CAN access her own plan
    post "/api/v1/login", params: { email: "alice@example.com", password: "password123" }
    assert_response :ok

    get "/api/v1/plans/#{@alice_plan.id}"
    assert_response :ok

    # Logout and login as Bob
    delete "/api/v1/logout"
    reset!

    post "/api/v1/login", params: { email: "bob@example.com", password: "password123" }
    assert_response :ok

    # Verify Bob CANNOT access Alice's plan
    get "/api/v1/plans/#{@alice_plan.id}"
    assert_response :not_found
  end

  test "user cannot access another user's entities" do
    # First verify Alice CAN access her own entity
    post "/api/v1/login", params: { email: "alice@example.com", password: "password123" }
    assert_response :ok

    get "/api/v1/entities/#{@alice_entity.id}"
    assert_response :ok

    # Logout and login as Bob
    delete "/api/v1/logout"
    reset!

    post "/api/v1/login", params: { email: "bob@example.com", password: "password123" }
    assert_response :ok

    # Verify Bob CANNOT access Alice's entity
    get "/api/v1/entities/#{@alice_entity.id}"
    assert_response :not_found
  end

  test "unauthenticated user cannot access plans" do
    get "/api/v1/plans/#{@alice_plan.id}"
    assert_response :unauthorized
  end

  test "unauthenticated user cannot access entities" do
    get "/api/v1/entities/#{@alice_entity.id}"
    assert_response :unauthorized
  end
end
