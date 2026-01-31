module Api
  module V1
    class EntitiesController < BaseController
      before_action :set_plan, only: [ :index, :create ]
      before_action :set_entity, only: [ :show, :update, :destroy ]

      def index
        entities = @plan.entities.includes(:ledger_entries)
        render json: EntitySerializer.render(entities, view: :with_ledger_entries)
      end

      def show
        render json: EntitySerializer.render(@entity, view: :with_ledger_entries)
      end

      def create
        entity = @plan.entities.build(entity_params)

        if entity.save
          render json: EntitySerializer.render(entity, view: :with_ledger_entries), status: :created
        else
          render json: { errors: entity.errors }, status: :unprocessable_entity
        end
      end

      def update
        if @entity.update(entity_params)
          render json: EntitySerializer.render(@entity, view: :with_ledger_entries)
        else
          render json: { errors: @entity.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        @entity.destroy
        head :no_content
      end

      private

      def set_plan
        @plan = current_user.plans.find(params[:plan_id])
      end

      def set_entity
        @entity = Entity.joins(:plan).where(plans: { user_id: current_user.id }).find(params[:id])
      end

      def entity_params
        permitted = params.require(:entity).permit(
          :name, :type, :template_key, :parent_id,
          data: {},
          ledger_entries_attributes: [ :id, :day, :amount, :share_quantity, :share_price, :_destroy ]
        )

        # Map incoming 'type' to 'entity_type' for storage
        permitted[:entity_type] = permitted.delete(:type) if permitted[:type].present?
        permitted
      end
    end
  end
end
