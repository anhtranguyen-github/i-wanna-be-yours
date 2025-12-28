from flask import Blueprint, jsonify, request
from services.resource_processor import ResourceProcessor
from services.queue_factory import get_redis_connection
from rq.job import Job
from rq.exceptions import NoSuchJobError

bp = Blueprint('resource', __name__, url_prefix='/resource')

@bp.route('/ingest/<resource_id>', methods=['POST'])
def trigger_ingest(resource_id):
    processor = ResourceProcessor()
    job_id = processor.trigger_ingestion(resource_id)
    if job_id:
        return jsonify({"status": "queued", "job_id": job_id}), 200
    else:
        return jsonify({"error": "Failed to enqueue ingestion"}), 500

@bp.route('/ingest/status/<job_id>', methods=['GET'])
def get_ingest_status(job_id):
    try:
        conn = get_redis_connection()
        job = Job.fetch(job_id, connection=conn)
        return jsonify({
            "job_id": job_id,
            "status": job.get_status(),
            "meta": job.meta,
            "result": job.result
        }), 200
    except NoSuchJobError:
        return jsonify({"error": "Job not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
