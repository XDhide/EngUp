import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .api import router
from .config import get_settings
from .predictor import load_bundle, predictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("ml.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor.set_bundle(load_bundle(get_settings().model_path))
    log.info("Model: %s", predictor.model_version or "chưa có -> fallback SM-2")
    yield


app = FastAPI(title="EngUp MLSever", version="1.0.0", lifespan=lifespan)
app.include_router(router)


@app.exception_handler(HTTPException)
async def http_exc(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"success": False, "message": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exc(_: Request, exc: RequestValidationError):
    errs = [{"loc": list(e.get("loc", [])), "msg": e.get("msg", "")} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"success": False, "message": "Dữ liệu không hợp lệ", "errors": errs})
