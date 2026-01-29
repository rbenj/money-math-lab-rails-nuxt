module Api
  module V1
    class BaseController < ApplicationController
      before_action :transform_params_to_snake_case
      before_action :authenticate_user!

      private

      def current_user
        @current_user ||= User.find_by(id: session[:user_id])
      end

      def authenticate_user!
        return if current_user

        render json: { error: 'Unauthorized' }, status: :unauthorized
      end

      def transform_params_to_snake_case
        params.deep_transform_keys!(&:underscore)
      end
    end
  end
end
