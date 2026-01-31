module Api
  module V1
    class PlansController < BaseController
      before_action :set_plan, only: [ :show, :update, :destroy ]

      def index
        plans = current_user.plans.order(updated_at: :desc)
        render json: PlanSerializer.render(plans)
      end

      def show
        render json: PlanSerializer.render(@plan, view: :with_entities)
      end

      def create
        plan = current_user.plans.build(plan_params)

        if plan.save
          # Add example entities if requested
          if params[:use_example] == true || params[:use_example] == "true"
            ::ExamplePlanService.new(plan).call
          end

          render json: PlanSerializer.render(plan), status: :created
        else
          render json: { errors: plan.errors }, status: :unprocessable_entity
        end
      end

      def update
        if @plan.update(plan_params)
          render json: PlanSerializer.render(@plan)
        else
          render json: { errors: @plan.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        @plan.destroy
        head :no_content
      end

      private

      def set_plan
        @plan = current_user.plans.find(params[:id])
      end

      def plan_params
        params.require(:plan).permit(:name, :birth_date, :retirement_age)
      end
    end
  end
end
