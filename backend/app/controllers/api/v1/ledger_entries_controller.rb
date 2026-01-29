module Api
  module V1
    class LedgerEntriesController < BaseController
      before_action :set_entity, only: [:index, :create]
      before_action :set_ledger_entry, only: [:show, :update, :destroy]

      def index
        render json: LedgerEntrySerializer.render(@entity.ledger_entries)
      end

      def show
        render json: LedgerEntrySerializer.render(@ledger_entry)
      end

      def create
        ledger_entry = @entity.ledger_entries.build(ledger_entry_params)

        if ledger_entry.save
          render json: LedgerEntrySerializer.render(ledger_entry), status: :created
        else
          render json: { errors: ledger_entry.errors }, status: :unprocessable_entity
        end
      end

      def update
        if @ledger_entry.update(ledger_entry_params)
          render json: LedgerEntrySerializer.render(@ledger_entry)
        else
          render json: { errors: @ledger_entry.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        @ledger_entry.destroy
        head :no_content
      end

      private

      def set_entity
        @entity = Entity.joins(:plan).where(plans: { user_id: current_user.id }).find(params[:entity_id])
      end

      def set_ledger_entry
        @ledger_entry = LedgerEntry.joins(entity: :plan).where(plans: { user_id: current_user.id }).find(params[:id])
      end

      def ledger_entry_params
        params.require(:ledger_entry).permit(:day, :amount, :share_quantity, :share_price)
      end
    end
  end
end
