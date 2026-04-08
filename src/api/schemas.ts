import Type from "typebox";

export const ErrorResponse = Type.Object({
  errors: Type.Optional(
    Type.Array(
      Type.Object({
        message: Type.Optional(
          Type.String({
            description: "A human readable description of the error",
          }),
        ),
      }),
    ),
  ),
});
