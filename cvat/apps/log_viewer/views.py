# Copyright (C) 2018-2022 Intel Corporation
#
# SPDX-License-Identifier: MIT

from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.response import Response


@extend_schema(exclude=True)
class LogViewerAccessViewSet(viewsets.ViewSet):
    serializer_class = None

    def list(self, request):
        return Response(status=status.HTTP_200_OK)
