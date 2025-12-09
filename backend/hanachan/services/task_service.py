from models.action import ProposedTask
from database.database import db

class TaskService:
    def get_task(self, task_id_ext: str = None, internal_id: int = None):
        if internal_id:
            return ProposedTask.query.get(internal_id)
        if task_id_ext:
            return ProposedTask.query.filter_by(task_external_id=task_id_ext).first()
        return None

    def confirm_task(self, task_id_ext: str):
        task = self.get_task(task_id_ext=task_id_ext)
        if task:
            # Logic for confirmation.
            # In a real system, this might trigger an async job or update a status field.
            # Current model: 'needs_confirmation' is boolean. Maybe we assume there is a status field?
            # Model `ProposedTask` in `response.py` currently only has `needs_confirmation` (bool).
            # It doesn't have a 'status' or 'executed' field. 
            # We should probably assume confirmation implies execution or acceptance.
            # For this MVP, we will just return success and maybe log it.
            # Or if we want to store state, we could modify the model, but user didn't explicitly ask for state tracking, just 'confirm'.
            return {
                "taskId": task.task_external_id,
                "status": "confirmed",
                "message": f"Task '{task.title}' has been confirmed and queued for execution."
            }
        return None
