import { AppError } from "../../cores/errors/AppError";
import { BusinessRepository } from "./business.repository";
import slugify from "slugify";

export interface CreateBusinessServiceInput {
  ownerId: string;
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  description?: string;
}

export class BusinessService {
  private businessRepository = new BusinessRepository();
async getMyBusiness(ownerId: string) {

  const business =
    await this.businessRepository.findByOwnerId(ownerId);

  if (!business) {
    throw new AppError(
      "Business not found.",
      404
    );
  }

  return business;
}
async deleteBusiness(ownerId: string) {

  const business =
    await this.businessRepository.findByOwnerId(ownerId);

  if (!business) {
    throw new AppError(
      "Business not found.",
      404
    );
  }

  await this.businessRepository.softDelete(
    business.id
  );

  return {
    message: "Business deleted successfully.",
  };
}
  async createBusiness(data: CreateBusinessServiceInput) {

  const existingBusiness =
    await this.businessRepository.findByOwnerId(data.ownerId);

  if (existingBusiness) {
    throw new AppError(
      "You already own a business.",
      409
    );
  }

  const slug = slugify(data.name, {
    lower: true,
    strict: true,
    trim: true,
  });

  const slugExists =
    await this.businessRepository.findBySlug(slug);

  if (slugExists) {
    throw new AppError(
      "Business slug already exists.",
      409
    );
  }

  const business =
    await this.businessRepository.create({
      ownerId: data.ownerId,
      name: data.name,
      slug,
      email: data.email,
      phone: data.phone,
      logo: data.logo,
      description: data.description,
    });

  return business;
}
}