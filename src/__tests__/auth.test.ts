import { StatusCodes } from "http-status-codes";
import supertest from "supertest";
import app from "@/utils/server";
import { userService } from "@/services/userService";
import mongoose from "mongoose";

describe("auth test suite", () => {
  const objectId = new mongoose.Types.ObjectId();
  const isUserExistServiceMock = jest.spyOn(userService, "isExistByEmail");
  const createUserServiceMock = jest.spyOn(userService, "create");

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
          _id: objectId,
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
          .mockResolvedValueOnce({
            id: objectId,
          });

        const {
          statusCode,
          body: { data },
        } = await supertest(app).post("/auth/sign-up").send({
          email: "john@example.com",
          password: "hello123",
          confirmPassword: "hello123",
        });

        expect(statusCode).toBe(StatusCodes.OK);
        expect(data).toBeTruthy();
        expect(data).toHaveProperty("accessToken", expect.any(String));
      });
    });
  });
});
