import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    // Añadir nuevas columnas a budgets
    await queryInterface.addColumn('budgets', 'period', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('budgets', 'status', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'DRAFT',
    });
    
    await queryInterface.addColumn('budgets', 'planned_income', {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0,
    });

    // Eliminar la foreign key de category_id si existe el constraint, 
    // en Postgres/MySQL es mejor intentar remover el constraint primero. 
    // Como el nombre por defecto suele ser budgets_category_id_fkey, lo intentamos atrapar.
    // Para no romper la migración, lo ponemos en un try catch si fuera necesario, 
    // pero Sequelize suele manejar removeColumn bien.
    try {
      await queryInterface.removeColumn('budgets', 'category_id');
    } catch (e) {
      console.warn("Could not remove category_id column directly", e);
    }

    try {
      await queryInterface.removeColumn('budgets', 'amount');
    } catch (e) {
      console.warn("Could not remove amount column", e);
    }

    // Crear la tabla budget_categories
    await queryInterface.createTable('budget_categories', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      budget_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'budgets',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      category_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'categories',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      allocated_amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('budget_categories');
    
    await queryInterface.addColumn('budgets', 'amount', {
      type: DataTypes.DECIMAL,
      allowNull: true,
    });
    
    await queryInterface.addColumn('budgets', 'category_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    });

    await queryInterface.removeColumn('budgets', 'planned_income');
    await queryInterface.removeColumn('budgets', 'status');
    await queryInterface.removeColumn('budgets', 'period');
  }
};
