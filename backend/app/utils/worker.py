# backend/app/utils/worker.py
from rq import Worker, Queue
from core.worker_config import redis_conn

def run_worker():
    q = Queue("sms_queue", connection=redis_conn)
    worker = Worker([q], connection=redis_conn)
    worker.work()

if __name__ == "__main__":
    run_worker()
