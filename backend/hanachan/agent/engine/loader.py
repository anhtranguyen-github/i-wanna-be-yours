import yaml
import os
import logging
from typing import Optional
from schemas.manifest_policy import Manifest, Policy

logger = logging.getLogger(__name__)

class ConfigLoader:
    _manifest: Optional[Manifest] = None
    _policy: Optional[Policy] = None

    @classmethod
    def get_manifest(cls) -> Manifest:
        if cls._manifest is None:
            cls.load_manifest()
        return cls._manifest

    @classmethod
    def get_policy(cls) -> Policy:
        if cls._policy is None:
            cls.load_policy()
        return cls._policy

    @classmethod
    def load_manifest(cls):
        path = os.path.join(os.path.dirname(__file__), "../../config/manifest.yaml")
        try:
            with open(path, "r") as f:
                data = yaml.safe_load(f)
                cls._manifest = Manifest(**data)
                logger.info("✅ Manifest loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load manifest from {path}: {e}")
            raise

    @classmethod
    def load_policy(cls):
        path = os.path.join(os.path.dirname(__file__), "../../config/policy.yaml")
        try:
            with open(path, "r") as f:
                data = yaml.safe_load(f)
                cls._policy = Policy(**data)
                logger.info("✅ Policy loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load policy from {path}: {e}")
            raise

    @classmethod
    def reload(cls):
        cls.load_manifest()
        cls.load_policy()
