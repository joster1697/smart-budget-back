import { Op } from "sequelize";
import { Category } from "../database/models";
import { User } from "../database/models";
import { CategoryCreationAttributes } from "../database/models/category";

//Interface para creacion de Categoria
export interface ICategoryCreate {
  name: string;
  user_id: string;
}
//Interface para actualizacion de Categoria
export interface ICategoryUpdate {
  name: string;
  user_id: string;
}

export class CategoryService {
  static async getCategoriesByUserId(userId: string) {
    return await Category.findAll({
      where: {
        [Op.or]: [
          { user_id: userId },
          { user_id: { [Op.is]: null } },
        ],
      } as any,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
    });
  }

  static async getCategoryById(categoryId: string, userId: string) {
    return await Category.findOne({
      where: { id: categoryId, user_id: userId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
    });
  }
  //Crear categoria nueva
  static async createCategory(categoryData: ICategoryCreate) {
    //Verificar que el usuario existe
    const user = await User.findByPk(categoryData.user_id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    //Crear la categoria
    const categoryToCreate: CategoryCreationAttributes = {
      name: categoryData.name,
      user_id: categoryData.user_id,
    };
    return await Category.create(categoryToCreate);
  }

  static async updateCategory(
    categoryId: string,
    userId: string,
    updateData: ICategoryUpdate,
  ) {
    // Buscar la categoria y verificar que pertenece al usuario
    const category = await Category.findOne({
      where: {
        id: categoryId,
        user_id: userId,
      },
    });

    if (!category) {
      throw new Error("Categoria no encontrada o no autorizada");
    }

    //Actualizar la categoria
    await category.update(updateData);
    return category;
  }

  //Eliminar Categoria
  static async deleteCategory(categoryId: string, userId: string) {
    const category = await Category.findOne({
      where: {
        id: categoryId,
        user_id: userId,
      },
    });

    if (!category) {
      throw new Error("Categoria no encontrada o no autorizada");
    }

    await category.destroy();
    return { message: "Categoria eliminada exitosamente" };
  }
}
