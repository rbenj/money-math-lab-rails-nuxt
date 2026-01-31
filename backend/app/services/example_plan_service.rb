# frozen_string_literal: true

# Service to populate a plan with demo entities from YAML
class ExamplePlanService
  YAML_PATH = Rails.root.join("config/example_plan_data.yml")

  def initialize(plan)
    @plan = plan
    @entity_id_map = {}
  end

  def call
    create_entities
    update_entity_references
  end

  private

  def example_data
    @example_data ||= YAML.load_file(YAML_PATH).deep_symbolize_keys
  end

  def create_entities
    example_data[:entities].each do |attrs|
      attrs = attrs.dup
      temp_id = attrs.delete(:temp_id)
      ledger_entries = attrs.delete(:ledger_entries) || []

      entity = @plan.entities.create!(
        name: attrs[:name],
        entity_type: attrs[:entity_type],
        template_key: attrs[:template_key],
        data: attrs[:data],
        ledger_entries_attributes: ledger_entries
      )
      @entity_id_map[temp_id] = entity.id if temp_id
    end
  end

  def update_entity_references
    @plan.entities.find_each do |entity|
      updates = {}
      data = entity.data&.dup || {}
      needs_update = false

      # Update temp id references with actual ids
      if data["temp_parent_id"]
        real_parent_id = @entity_id_map[data["temp_parent_id"]]
        if real_parent_id
          updates[:parent_id] = real_parent_id
          needs_update = true
        end
        data.delete("temp_parent_id")
      end

      if data["target_entity_id"].is_a?(String) && @entity_id_map[data["target_entity_id"]]
        data["target_entity_id"] = @entity_id_map[data["target_entity_id"]]
        needs_update = true
      end

      if data["source_entity_id"].is_a?(String) && @entity_id_map[data["source_entity_id"]]
        data["source_entity_id"] = @entity_id_map[data["source_entity_id"]]
        needs_update = true
      end

      if data["payment_source_entity_id"].is_a?(String) && @entity_id_map[data["payment_source_entity_id"]]
        data["payment_source_entity_id"] = @entity_id_map[data["payment_source_entity_id"]]
        needs_update = true
      end

      if needs_update
        updates[:data] = data
        entity.update!(updates)
      end
    end
  end
end
