require "test_helper"

class ExamplePlanServiceTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(
      email: "servicetest@example.com",
      password: "password123",
      name: "Service Test User"
    )
    @plan = Plan.create!(
      user: @user,
      name: "Test Plan",
      birth_date: "1990-01-15",
      retirement_age: 65
    )
  end

  test "creates complete plan with all entities from YAML" do
    yaml_data = YAML.load_file(Rails.root.join("config", "example_plan_data.yml"))
    expected_entity_count = yaml_data["entities"].length

    initial_count = Entity.count

    ExamplePlanService.new(@plan).call

    # Verify all entities from YAML were created
    assert_equal initial_count + expected_entity_count, Entity.count,
      "Should have created exactly #{expected_entity_count} entities from YAML"
    assert_equal expected_entity_count, @plan.entities.reload.count

    # Verify ledger entries were created
    entities_with_ledger = @plan.entities.joins(:ledger_entries).distinct
    assert entities_with_ledger.any?, "Some entities should have ledger entries"

    # Verify entity references were resolved (no temp_ prefixes remain in data)
    @plan.entities.each do |entity|
      if entity.data.present?
        entity.data.each do |key, value|
          assert_not key.to_s.start_with?("temp_"), "Temp key should be resolved: #{key}"
          if key.to_s.end_with?("_entity_id") && value.present?
            # Entity ID references should be valid UUIDs, not temp IDs
            assert_match(/\A[0-9a-f-]{36}\z/i, value.to_s, "#{key} should be a UUID")
          end
        end
      end
    end
  end

  test "rolls back all entities on validation failure" do
    initial_entity_count = Entity.count
    initial_ledger_count = LedgerEntry.count

    # Create a service subclass that raises an error during update phase
    service = ExamplePlanService.new(@plan)

    # Override update_entity_references to raise after entities are created
    def service.update_entity_references
      raise StandardError, "Simulated failure during update"
    end

    # The transaction should rollback and re-raise
    assert_raises(StandardError) do
      service.call
    end

    # Verify transaction rolled back - counts should be unchanged
    assert_equal initial_entity_count, Entity.count, "Entity count should be unchanged after rollback"
    assert_equal initial_ledger_count, LedgerEntry.count, "LedgerEntry count should be unchanged after rollback"
  end
end
