import app from "@/utils/server";
import supertest from "supertest";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { userService, verificationService } from "@/services";
import { UserMail } from "@/mailer";

describe("User test suite", () => {
  const objectId = new mongoose.Types.ObjectId();
  const mockUserEmail = "user@mock.com";
  const mockAccessToken = "some-access-token-123";
  const getByValidAccessTokenMock = jest.spyOn(
    verificationService,
    "getByValidAccessToken"
  );
  const updateVerificationAndEmailByUserIdMock = jest.spyOn(
    userService,
    "updateVerificationAndEmailByUserId"
  );
  const deleteManyByUserIdMock = jest.spyOn(
    verificationService,
    "deleteManyByUserId"
  );
  const successfullyVerifiedMock = jest.spyOn(
    UserMail.prototype,
    "successfullyVerified"
  );

  afterAll(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("email verification", () => {
    describe("invalid or expired access token", () => {
      it("should return forbidden", async () => {
        getByValidAccessTokenMock.mockResolvedValue(null);

        const { statusCode } = await supertest(app).get(
          `/user/verification/${mockAccessToken}`
        );

        expect(statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(getByValidAccessTokenMock).toBeCalledWith(mockAccessToken);
      });
    });

    describe("no user found", () => {
      it("should return forbidden", async () => {
        getByValidAccessTokenMock
          // @ts-ignore
          .mockResolvedValueOnce({
            user: objectId as unknown as mongoose.ObjectId,
            email: mockUserEmail,
          });
        updateVerificationAndEmailByUserIdMock.mockResolvedValueOnce(null);

        const { statusCode } = await supertest(app).get(
          `/user/verification/${mockAccessToken}`
        );

        expect(statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(updateVerificationAndEmailByUserIdMock).toBeCalledWith(
          objectId as unknown as mongoose.ObjectId,
          mockUserEmail
        );
      });
    });

    describe("valid access token", () => {
      it("should return ok", async () => {
        getByValidAccessTokenMock
          // @ts-ignore
          .mockResolvedValueOnce({
            user: objectId as unknown as mongoose.ObjectId,
            email: mockUserEmail,
          });
        updateVerificationAndEmailByUserIdMock
          // @ts-ignore
          .mockResolvedValueOnce({
            email: mockUserEmail,
            save: jest.fn(),
          });
        deleteManyByUserIdMock.mockResolvedValueOnce({
          acknowledged: true,
          deletedCount: 1,
        });
        successfullyVerifiedMock.mockResolvedValueOnce();

        const { statusCode } = await supertest(app).get(
          `/user/verification/${mockAccessToken}`
        );

        expect(statusCode).toBe(StatusCodes.OK);
        expect(updateVerificationAndEmailByUserIdMock).toBeCalledWith(
          objectId as unknown as mongoose.ObjectId,
          mockUserEmail
        );
        expect(successfullyVerifiedMock).toBeCalledWith({
          email: mockUserEmail,
        });
      });
    });
  });
});
