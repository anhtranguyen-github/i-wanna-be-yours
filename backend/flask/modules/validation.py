
from flask import request, jsonify
from marshmallow import Schema, fields, ValidationError, EXCLUDE
from functools import wraps

def validate_request(schema_cls):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            schema = schema_cls()
            try:
                # Combine JSON and args for validation
                data = request.get_json(silent=True) or {}
                # Add form data if present
                if request.form:
                    # Treat specific known list fields as lists
                    list_fields = ['tags']
                    form_data = request.form.to_dict() # flat=True by default
                    for field in list_fields:
                        if field in request.form:
                            form_data[field] = request.form.getlist(field)
                    data.update(form_data)
                
                valid_data = schema.load(data, unknown=EXCLUDE)
                request.validated_data = valid_data
            except ValidationError as err:
                return jsonify({
                    "code": "VALIDATION_ERROR",
                    "error": "Invalid request data",
                    "details": err.messages
                }), 400
            return f(*args, **kwargs)
        return decorated
    return decorator

# Common Schemas
class ResourceUploadSchema(Schema):
    description = fields.Str(required=False)
    tags = fields.List(fields.Str(), required=False)

class ResourceUpdateSchema(Schema):
    title = fields.Str(required=False)
    description = fields.Str(required=False)
    tags = fields.List(fields.Str(), required=False)
    ingestionStatus = fields.Str(required=False)
