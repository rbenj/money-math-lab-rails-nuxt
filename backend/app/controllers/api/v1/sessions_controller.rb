module Api
  module V1
    class SessionsController < BaseController
      skip_before_action :authenticate_user!, only: [:create, :register]

      def show
        render json: UserSerializer.render(current_user)
      end

      def create
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password])
          session[:user_id] = user.id
          render json: UserSerializer.render(user)
        else
          render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
      end

      def register
        user = User.new(user_params)

        if user.save
          session[:user_id] = user.id
          render json: UserSerializer.render(user), status: :created
        else
          render json: { errors: user.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        session.delete(:user_id)
        head :no_content
      end

      private

      def user_params
        params.require(:user).permit(:email, :password, :password_confirmation, :name)
      end
    end
  end
end
