import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import supertest from "supertest";
import app from "@/utils/server";
import { userService, verificationService } from "@/services";
import { UserMail } from "@/mailer";
// import { User as UserModel, Verification as VerificationModel } from "@/models";

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
  // const userSaveMock = jest.spyOn(UserModel.prototype, "save");
  // const verificationSaveMock = jest.spyOn(VerificationModel.prototype, "save");

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
});
