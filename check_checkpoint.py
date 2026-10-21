from app.graph.graph import graph
email_id =" qwerty@gmail.com"

config={
    "configurable":{
        "thread_id":email_id
    }
}

snapshot =graph.get_state(config)

print("current graph state:",snapshot.values)
print("Next nodes:",snapshot.next)
print("interrupts:",snapshot.tasks)