import app from "@/utils/server";
import supertest from "supertest";
import mongoose from "mongoose";
import * as Jwt from "@/utils/jwt";
import { StatusCodes } from "http-status-codes";
import {
  resetPasswordService,
  userService,
  verificationService,
} from "@/services";
import { UserMail } from "@/mailer";
import { redis } from "@/dataSources";

describe("auth test suite", () => {
  const objectId1 = new mongoose.Types.ObjectId();
  const objectId2 = new mongoose.Types.ObjectId();

  const isUserExistServiceMock = jest.spyOn(userService, "isExistByEmail");
  const createUserServiceMock = jest.spyOn(userService, "create");
  const addVerificationToUserMock = jest.spyOn(
    userService,
    "addVerificationToUser"
  );
  const createVerificationServiceMock = jest.spyOn(
    verificationService,
    "create"
  );
  const sendVerificationMailMock = jest.spyOn(
    UserMail.prototype,
    "verification"
  );
  const sendResetPasswordMailMock = jest.spyOn(
    UserMail.prototype,
    "resetPassword"
  );
  const getUserByIdMock = jest.spyOn(userService, "getById");

  afterAll(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("sign up", () => {
    describe("with no body", () => {
      it("should return 400 status", async () => {
        await supertest(app)
          .post("/auth/sign-up")
          .expect(StatusCodes.BAD_REQUEST);
      });
    });

    describe("with invalid email", () => {
      it("should return 400 with error body", async () => {
        const {
          statusCode,
          body: { error },
        } = await supertest(app).post("/auth/sign-up").send({ email: "john" });

        expect(statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(error).toBeTruthy();
        expect(error).toHaveProperty("email", "Enter a valid email");
      });
    });

    describe("with different password and password confirmation", () => {
      it("should return 400 with error body", async () => {
        const {
          statusCode,
          body: { error },
        } = await supertest(app)
          .post("/auth/sign-up")
          .send({ password: "hello123", confirmPassword: "hello" });

        expect(statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(error).toBeTruthy();
        expect(error).toHaveProperty(
          "confirmPassword",
          "Passwords don't match"
        );
      });
    });

    describe("with duplicate email", () => {
      it("should return 409", async () => {
        isUserExistServiceMock.mockResolvedValueOnce({
          _id: objectId1,
        });

        const { statusCode } = await supertest(app).post("/auth/sign-up").send({
          email: "john@example.com",
          password: "hello123",
          confirmPassword: "hello123",
        });

        expect(statusCode).toBe(StatusCodes.CONFLICT);
        expect(isUserExistServiceMock).toBeCalledWith("john@example.com");
      });
    });

    describe("with valid user body", () => {
      it("should return 200 with access token", async () => {
        isUserExistServiceMock.mockResolvedValueOnce(null);
        createUserServiceMock
          // @ts-ignore
          .mockReturnValueOnce({
            id: objectId1,
            save: jest.fn(),
          });
        createVerificationServiceMock
          // @ts-ignore
          .mockReturnValueOnce({
            id: objectId2,
            save: jest.fn(),
          });

        sendVerificationMailMock.mockResolvedValueOnce();
        addVerificationToUserMock.mockResolvedValueOnce();

        // userSaveMock.mockResolvedValueOnce({});
        // verificationSaveMock.mockResolvedValueOnce({});

        const {
          statusCode,
          body: { data },
        } = await supertest(app).post("/auth/sign-up").send({
          email: "john@example.com",
          password: "hello123",
          confirmPassword: "hello123",
        });

        expect(statusCode).toBe(StatusCodes.OK);
        expect(addVerificationToUserMock).toBeCalledWith({
          user: expect.any(Object),
          verificationId: objectId2,
        });
        expect(data).toBeTruthy();
        expect(data).toHaveProperty("accessToken", expect.any(String));
      });
    });
  });

  describe("sign out", () => {
    describe("without authorization header", () => {
      it("should return forbidden", async () => {
        const { statusCode } = await supertest(app).get("/auth/sign-out");

        expect(statusCode).toBe(StatusCodes.FORBIDDEN);
      });
    });

    describe("with access token", () => {
      it("should return OK", async () => {
        const mockAccessToken = "some-access-token-123";
        const jwtVerifyMock = jest.spyOn(Jwt, "jwtVerify");
        const redisGetMock = jest.spyOn(redis.client, "get");
        const redisSetMock = jest.spyOn(redis.client, "set");

        jwtVerifyMock.mockReturnValueOnce({
          id: objectId1 as unknown as mongoose.ObjectId,
        });
        getUserByIdMock
          // @ts-ignore
          .mockResolvedValueOnce({
            id: objectId1,
          });
        redisGetMock.mockResolvedValueOnce(null);
        redisSetMock.mockResolvedValueOnce(null);

        const { statusCode } = await supertest(app)
          .get("/auth/sign-out")
          .set("authorization", `Bearer ${mockAccessToken}`);

        expect(statusCode).toBe(200);
        expect(redisSetMock).toBeCalledWith(
          `expiredToken:${mockAccessToken}`,
          `${objectId1}`,
          expect.any(Object)
        );
      });
    });
  });

  describe("reset password request", () => {
    describe("without email", () => {
      it("should return 400 status", async () => {
        const {
          status,
          body: { error },
        } = await supertest(app).post("/auth/password/reset");

        expect(status).toBe(StatusCodes.BAD_REQUEST);
        expect(error).toBeTruthy();
        expect(error).toHaveProperty("email");
      });
    });

    describe("with valid email", () => {
      it("should return OK", async () => {
        const mockUserEmail = "user@mock.com";
        const getUserByEmailMock = jest.spyOn(userService, "getByEmail");
        const createPasswordResetMock = jest.spyOn(
          resetPasswordService,
          "create"
        );
        const addResetPasswordToUserMock = jest.spyOn(
          userService,
          "addResetPasswordToUser"
        );

        getUserByEmailMock
          // @ts-ignore
          .mockResolvedValueOnce({
            id: objectId1,
            save: jest.fn(),
          });

        createPasswordResetMock
          // @ts-ignore
          .mockReturnValueOnce({
            id: objectId2,
            save: jest.fn(),
          });

        addResetPasswordToUserMock.mockResolvedValueOnce();
        sendResetPasswordMailMock.mockResolvedValueOnce();

        const { status } = await supertest(app)
          .post("/auth/password/reset")
          .send({ email: mockUserEmail });

        expect(getUserByEmailMock).toBeCalledWith(mockUserEmail);
        expect(createPasswordResetMock).toBeCalledWith({
          userId: objectId1,
          accessToken: expect.any(String),
          expiresIn: expect.any(Date),
        });
        expect(addResetPasswordToUserMock).toBeCalledWith({
          user: expect.any(Object),
          resetPasswordId: objectId2,
        });
        expect(sendResetPasswordMailMock).toBeCalledWith({
          email: mockUserEmail,
          accessToken: expect.any(String),
        });
        expect(status).toBe(StatusCodes.OK);
      });
    });
  });

  describe("set new password", () => {
    const findByValidAccessTokenMock = jest.spyOn(
      resetPasswordService,
      "findByValidAccessToken"
    );
    const mockAccessToken = "some-access-token-123";
    const newPassword = "newPassword";

    describe("without access token", () => {
      it("should return 400", async () => {
        findByValidAccessTokenMock.mockResolvedValueOnce(null);

        const { status } = await supertest(app)
          .post(`/auth/password/new/${mockAccessToken}`)
          .send({ password: newPassword, confirmPassword: newPassword });

        expect(status).toBe(StatusCodes.BAD_REQUEST);
      });

      describe("with valid access token", () => {
        it("should return OK", async () => {
          const updatePasswordByUserIdMock = jest.spyOn(
            userService,
            "updatePasswordByUserId"
          );
          const deleteManyByUserIdMock = jest.spyOn(
            resetPasswordService,
            "deleteManyByUserId"
          );
          const successfullyUpdatedPasswordMock = jest.spyOn(
            UserMail.prototype,
            "successfullyUpdatedPassword"
          );
          findByValidAccessTokenMock
            // @ts-ignore
            .mockResolvedValueOnce({
              user: objectId1 as unknown as mongoose.ObjectId,
            });
          getUserByIdMock
            // @ts-ignore
            .mockResolvedValueOnce({
              id: objectId1,
            });
          updatePasswordByUserIdMock
            // @ts-ignore
            .mockResolvedValueOnce({
              save: jest.fn(),
            });
          deleteManyByUserIdMock
            // @ts-ignore
            .mockResolvedValueOnce({});

          successfullyUpdatedPasswordMock.mockResolvedValueOnce();

          const { status } = await supertest(app)
            .post(`/auth/password/new/${mockAccessToken}`)
            .send({
              password: newPassword,
              confirmPassword: newPassword,
            });

          expect(status).toBe(StatusCodes.OK);
          expect(updatePasswordByUserIdMock).toBeCalledWith(
            objectId1,
            expect.any(String)
          );
        });
      });
    });
  });
});
