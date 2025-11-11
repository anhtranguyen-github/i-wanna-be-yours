

from modules.llm_factory import load_config_from_yaml


# Import the model factory and config loader
from modules.llm_factory import load_config_from_yaml, create_llm_instance 


# --- 1. Model Configuration and Initialization ---

# Load configuration (from simulated external file/env)
GLOBAL_CONFIG = load_config_from_yaml("llm_factory_test_config.yaml")
LLM_CONFIG = GLOBAL_CONFIG.llm_config

# Initialize LLMs using the factory, based on the flexible configuration
router_llm_config = LLM_CONFIG['router_llm']
router_llm = create_llm_instance(router_llm_config)


print(router_llm.invoke("Hello ?"))