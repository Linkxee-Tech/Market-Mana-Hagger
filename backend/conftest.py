
import sys
from pathlib import Path

# Add all microservice directories to sys.path
root_dir = Path(__file__).resolve().parent
sys.path.append(str(root_dir / "vision-analyzer"))
sys.path.append(str(root_dir / "price-intelligence"))
sys.path.append(str(root_dir / "ui-action-engine"))
sys.path.append(str(root_dir / "clip-renderer"))
# orchestrator is already in path/root, but explicitly adding safe measure
sys.path.append(str(root_dir / "orchestrator"))
