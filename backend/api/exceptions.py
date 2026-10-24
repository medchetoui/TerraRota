"""
Custom exception handler for TerraRota API.
Returns structured JSON errors without exposing stack traces.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger("terrarota")


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # Wrap DRF validation errors
        return Response(
            {
                "status": "error",
                "code": "VALIDATION_ERROR",
                "errors": response.data,
            },
            status=response.status_code,
        )

    # Unexpected errors — log but don't expose internals
    logger.exception("Unhandled exception in %s", context.get("view"))
    return Response(
        {
            "status": "error",
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again.",
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
