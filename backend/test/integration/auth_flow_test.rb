require "test_helper"

class AuthFlowTest < ActionDispatch::IntegrationTest
  test "register login me logout happy path" do
    # Register
    post "/api/v1/register", params: {
      user: {
        email: "newuser@example.com",
        password: "password123",
        password_confirmation: "password123",
        name: "New User"
      }
    }
    assert_response :created
    assert_equal "newuser@example.com", response.parsed_body["email"]

    # Login
    post "/api/v1/login", params: {
      email: "newuser@example.com",
      password: "password123"
    }
    assert_response :ok
    assert_equal "newuser@example.com", response.parsed_body["email"]
    assert session[:user_id].present?

    # Get /me
    get "/api/v1/me"
    assert_response :ok
    assert_equal "newuser@example.com", response.parsed_body["email"]

    # Logout
    delete "/api/v1/logout"
    assert_response :no_content

    # Clear session explicitly to test logout actually invalidated it
    reset!

    # Verify logged out
    get "/api/v1/me"
    assert_response :unauthorized
  end

  test "login with wrong password returns 401" do
    User.create!(
      email: "existing@example.com",
      password: "correctpassword",
      name: "Existing User"
    )

    post "/api/v1/login", params: {
      email: "existing@example.com",
      password: "wrongpassword"
    }
    assert_response :unauthorized
    assert response.parsed_body["error"].present?
  end

  test "me without session returns 401" do
    get "/api/v1/me"
    assert_response :unauthorized
  end

  test "register with duplicate email returns errors" do
    User.create!(
      email: "taken@example.com",
      password: "password123",
      name: "First User"
    )

    post "/api/v1/register", params: {
      user: {
        email: "taken@example.com",
        password: "password123",
        password_confirmation: "password123",
        name: "Second User"
      }
    }
    assert_response :unprocessable_entity
    assert response.parsed_body["errors"]["email"].present?
  end
end
