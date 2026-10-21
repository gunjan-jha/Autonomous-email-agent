# import os
# import builtins
# from typing import TypedDict, List,Dict,Any,Optional
# from langgraph.graph import StateGraph,START,END
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_core.messages import HumanMessage
# from pydantic import BaseModel,Field
# from dotenv import load_dotenv

# load_dotenv()

# class EmailClassifcation(BaseModel):
#       is_spam:bool=Field(description="True if this email is spam, false if legitimate")
#       spam_reason:Optional[str]=Field(default=None,description="Why it's spam if applicable")
#       category:Optional[str]=Field(default=None,description="inquiry,complaint,thank you,request etc-only if legitimate")

# class EmailState(TypedDict):
#     #The email being processed
#        email:Dict[builtins.str,Any]

#     #Category of the email(inquiry,complaint,etc.)
#        email_category:Optional[builtins.str]

#     #Reason why the email was marked as spam
#        spam_reason:Optional[builtins.str]

#     #analysis and decisions
#        is_spam:Optional[bool]

#     #Response generation
#        email_draft:Optional[bool]

#     #Processing metadata
#        messages:List[Dict[str,Any]] #track convesation with llm for analysis

# model=ChatGoogleGenerativeAI(
#         model="gemini-3.6-flash",
#         api_key=os.getenv("GOOGLE_API_KEY")
# )

# classifier =model.with_structured_output(EmailClassifcation)



# def get_text(content) -> str:
#     """Gemini/LangChain sometimes returns content as a list of parts instead of a plain string."""
#     if isinstance(content, str):
#         return content
#     if isinstance(content, list):
#         parts = []
#         for item in content:
#             if isinstance(item, str):
#                 parts.append(item)
#             elif isinstance(item, dict):
#                 parts.append(item.get("text", ""))
#         return "".join(parts)
#     return str(content)

# def read_email(state: EmailState):
#         """Alfred reads and logs the imcoming email"""
#         email = state["email"]

#         #Here we might do some initial preprocessing
#         print(f"Alfred is processing an email from {email['sender']} with subject:{email['subject']}")

#         #No state changes needed here 
#         return {}

# def classify_email(state: EmailState):
#         """Alfred uses an llm to determine if the email is spam or legitimate"""
#         email=state["email"]
#         #Prepare our prompt for the LLM

#         prompt=f"""
#         As alfred the butler ,analyze this email and determine if it is spam or legitimate.

#         Email:
#         From:{email['sender']}
#         Subject:{email['subject']}
#         Body:{email['body']}
#         First, determine if this email is spam. if it is spam, explain why.
#         If it is legitimate,categorize it (inquiry,complaint,thank you etc.)
#         """

#         messages =[HumanMessage(content=prompt)]
#         response = classifier.invoke(messages)

#         new_messages=state.get("messages",[])+[
#               {"role":"user","content":prompt},
#               {"role":"assistant","content":response.model_dump()}
#         ]

#         # Return state updates
#         return {
#                "is_spam":response.is_spam,
#                "spam_reason":response.spam_reason,
#                "email_category":response.category,
#                "messages":new_messages
#         }

# def handle_spam(state:EmailState):
#        """Alfred discard email with a note"""
#        print(f"Alfred has marked the email as spam .Reason:{state['spam_reason']}")
#        print("The email has been marked to the spam folder.")
#     #we are done processing this email
#        return {}

# def draft_response(state:EmailState):
#        """ Alfred drafts a preliminary response for legitimate emails"""
#        email =state["email"]
#        category=state["email_category"] or "general"

#        #prepare our prompt for the LLM
#        prompt=f"""
#        As Alfred the butler, draft a polite preliminary response to this email.
#        Email:
#        From: {email['sender']}
#        subject:{email['subject']}
#        Body: {email['body']}
#        This email has been categorized as: {category}
#        Draft a brief ,professional response that Mr. Hugg can review and personalize before sendng.
#        """


#        #call the LLM
#        messages = [HumanMessage(content=prompt)]
#        response =model.invoke(messages)


#        #update messages for tracking
#        new_messages = state.get("messages",[])+[
#               {"role":"user","content":prompt},
#               {"role": "assitant","content":response.content}
#        ]

#        #return state updates
#        return {
#               "email_draft":response.content,
#               "messages":new_messages
#        }
# def notify_mr_hugg(state:EmailState):
#        """Alfred notices Mr. Hugg about the email and presents the draft response"""

#        email = state["email"]
#        print("\n"+"="*50)
#        print(f"Sir,you've received an email from {email['sender']}.")
#        print(f"Subject:{email['subject']}")
#        print(f"category:{state['email_category']}")
#        print("\nI've prepared a draft response for your review:")
#        print("-"*50)
#        print(state["email_draft"])
#        print("="*50 + "\n")
#        # we re done processing this email
#        return {}

# def route_email(state:EmailState)->str:
#        """Determine the next step based on spam classification"""
#        if state["is_spam"]:
#               return "spam"
#        else:
#               return "legitimate"

# #create the graph
# email_graph = StateGraph(EmailState)

# #Add nodes

# email_graph.add_node("read_email",read_email)
# email_graph.add_node("classify_email",classify_email)
# email_graph.add_node("handle_spam",handle_spam)
# email_graph.add_node("draft_response",draft_response)
# email_graph.add_node("notify_mr_hugg",notify_mr_hugg)

# email_graph.add_edge(START,"read_email")
# email_graph.add_edge("read_email","classify_email")
# email_graph.add_conditional_edges("classify_email",route_email,{
#        "spam":"handle_spam",
#        "legitimate":"draft_response"
# })

# email_graph.add_edge("handle_spam",END)
# email_graph.add_edge("draft_response","notify_mr_hugg")
# email_graph.add_edge("notify_mr_hugg",END)

# compiled_graph = email_graph.compile()

# legitimate_email ={
#        "sender":"john.smith@example.com",
#        "subject":"Question about your services",
#        "body":"Dear Mr.hugg, I was referred to you by a colleague and I'm interested in learning more about your consulting services."
#        "could we schedule a call next week? Best regards,John Smith"
# }

# # Example spam email
# spam_email = {
#     "sender": "winner@lottery-intl.com",
#     "subject": "YOU HAVE WON $5,000,000!!!",
#     "body": "CONGRATULATIONS! You have been selected as the winner of our international lottery! To claim your $5,000,000 prize, please send us your bank details and a processing fee of $100."
# }

# # print("\n Processing legitimate email...")
# # legitimate_result = compiled_graph.invoke({
# #        "email":legitimate_email,
# #        "is_spam":None,
# #        "spam_reason":None,
# #        "email_category":None,
# #        "email_draft":None,
# #        "messages":[]
# # })

# print("\nProcess the spam email")

# print("\nProcessing spam email...")
# spam_result = compiled_graph.invoke({
#    "email": spam_email,
#     "is_spam":None,
#     "spam_reason":None,
#     "email_category":None,
#     "email_draft":None,
#     "messages":[]    
# })

# cpng_bytes = compiled_graph.get_graph().draw_mermaid_png()
# with open("graph.png", "wb") as f:
#     f.write(cpng_bytes)