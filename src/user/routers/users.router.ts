import { Router, Response, Request } from "express";
import { authMiddleware } from "../../auth/auth-middleware";
import { usersService } from "../application/user.service";
import { HttpStatus } from "../../core/types/http-statuses";
import { usersQueryRepository } from "../repositories/user.query.repository";
import { UserViewModel } from "../dto/user.view-model";
import { passwordValidation } from "../validation/password.validation";
import { loginValidation } from "../validation/login.validation";
import { emailValidation } from "../validation/email.validation";
import { inputValidationResultMiddleware } from "../../core/utils/input-validtion-result.middleware";
import { PaginatedOutput } from "../../core/types/paginated.output";
import { UserQueryInput } from "../types/user-query.input";
import { setSortAndPagination } from "../../core/helpers/set-sort-and-pagination";
import { InputUserDto } from "../dto/user.input-dto";
import { PaginationAndSorting } from "../../core/types/pagination-and-sorting";
import { UserSortField } from "../types/UserSortFields";
import { ValidationError } from "../../core/utils/app-response-errors";

export const usersRouter = Router({});
usersRouter.get(
  "/",
  authMiddleware,
  async (
    req: Request<{}, {}, UserQueryInput>,
    res: Response<PaginatedOutput>,
  ) => {
    const {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    }: PaginationAndSorting<UserSortField> = setSortAndPagination(req.query);

    const allUsers = await usersQueryRepository.findAllUsers({
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    });
    if (!allUsers) throw new ValidationError();
    res.status(HttpStatus.Ok).send(allUsers);
  },
);

usersRouter.post(
  "/",
  authMiddleware,
  passwordValidation,
  loginValidation,
  emailValidation,
  inputValidationResultMiddleware,
  async (req: Request<{}, {}, InputUserDto>, res: Response<UserViewModel>) => {
    const { login, password, email } = req.body;
    const userId = await usersService.create({ login, password, email });
    const newUser = await usersQueryRepository.findById(userId);
    if (!newUser) {
      throw new ValidationError("Invalid user data");
    }
    res.status(HttpStatus.Created).send(newUser!);
  },
);

usersRouter.delete(
  "/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const user = await usersService.delete(id);

    if (!user) throw new ValidationError("Invalid user id");

    res.sendStatus(HttpStatus.NoContent);
  },
);
