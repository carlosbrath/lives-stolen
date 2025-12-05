var _a;
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, Form, useActionData, useNavigation, Link, useLoaderData, useFetcher, useRouteError, useNavigate } from "@remix-run/react";
import { createReadableStreamFromReadable, json, redirect } from "@remix-run/node";
import { isbot } from "isbot";
import "@shopify/shopify-app-remix/adapters/node";
import { shopifyApp, AppDistribution, ApiVersion, LoginErrorType, boundary } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import { useState, useEffect, createContext, useCallback, useContext, useRef, useMemo } from "react";
import { AppProvider, Page, Card, FormLayout, Text, TextField, Button, Layout, BlockStack, Link as Link$1, List, Box, Banner, InlineStack } from "@shopify/polaris";
import { AppProvider as AppProvider$1 } from "@shopify/shopify-app-remix/react";
import { NavMenu, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}
const prisma = global.prismaGlobal ?? new PrismaClient();
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: (_a = process.env.SCOPES) == null ? void 0 : _a.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
ApiVersion.January25;
const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
shopify.unauthenticated;
const login = shopify.login;
shopify.registerWebhooks;
shopify.sessionStorage;
const streamTimeout = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, remixContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url }),
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
function App$2() {
  return /* @__PURE__ */ jsxs("html", { children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ jsx("link", { rel: "preconnect", href: "https://cdn.shopify.com/" }),
      /* @__PURE__ */ jsx(
        "link",
        {
          rel: "stylesheet",
          href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        }
      ),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(Outlet, {}),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App$2
}, Symbol.toStringTag, { value: "Module" }));
const action$9 = async ({ request }) => {
  var _a2, _b;
  const { topic, shop, session, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for shop: ${shop}`);
  console.log("Customer data request payload:", payload);
  try {
    const customerId = (_a2 = payload.customer) == null ? void 0 : _a2.id;
    const customerEmail = (_b = payload.customer) == null ? void 0 : _b.email;
    const ordersRequested = payload.orders_requested || [];
    console.log(`Data request for customer: ${customerEmail} (ID: ${customerId})`);
    const submissions = await prisma.submission.findMany({
      where: {
        submitterEmail: customerEmail
      },
      select: {
        id: true,
        submitterName: true,
        submitterEmail: true,
        victimName: true,
        relation: true,
        age: true,
        gender: true,
        incidentDate: true,
        state: true,
        roadUserType: true,
        injuryType: true,
        shortTitle: true,
        victimStory: true,
        photoUrls: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true
      }
    });
    console.log(`Found ${submissions.length} submissions for customer ${customerEmail}`);
    console.log("Customer data:", JSON.stringify(submissions, null, 2));
    console.log({
      type: "GDPR_DATA_REQUEST",
      shop,
      customerId,
      customerEmail,
      requestedAt: (/* @__PURE__ */ new Date()).toISOString(),
      dataFound: submissions.length > 0,
      submissionsCount: submissions.length
    });
  } catch (error) {
    console.error("Error processing customer data request:", error);
  }
  return new Response("Customer data request processed", { status: 200 });
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$9
}, Symbol.toStringTag, { value: "Module" }));
const action$8 = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  const current = payload.current;
  if (session) {
    await prisma.session.update({
      where: {
        id: session.id
      },
      data: {
        scope: current.toString()
      }
    });
  }
  return new Response();
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8
}, Symbol.toStringTag, { value: "Module" }));
const action$7 = async ({ request }) => {
  var _a2, _b;
  const { topic, shop, session, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for shop: ${shop}`);
  console.log("Customer redaction payload:", payload);
  try {
    const customerId = (_a2 = payload.customer) == null ? void 0 : _a2.id;
    const customerEmail = (_b = payload.customer) == null ? void 0 : _b.email;
    const ordersToRedact = payload.orders_to_redact || [];
    console.log(`Redacting data for customer: ${customerEmail} (ID: ${customerId})`);
    const submissions = await prisma.submission.findMany({
      where: {
        submitterEmail: customerEmail
      }
    });
    console.log(`Found ${submissions.length} submissions to redact for ${customerEmail}`);
    const anonymized = await prisma.submission.updateMany({
      where: {
        submitterEmail: customerEmail
      },
      data: {
        submitterName: "Anonymous User",
        submitterEmail: `redacted_${customerId}@gdpr-deleted.local`,
        adminNotes: `[GDPR] Customer data redacted on ${(/* @__PURE__ */ new Date()).toISOString()}`
      }
    });
    console.log(`Anonymized ${anonymized.count} submissions for customer ${customerEmail}`);
    console.log({
      type: "GDPR_CUSTOMER_REDACTION",
      shop,
      customerId,
      customerEmail,
      redactedAt: (/* @__PURE__ */ new Date()).toISOString(),
      submissionsAffected: anonymized.count,
      ordersToRedact: ordersToRedact.length
    });
  } catch (error) {
    console.error("Error processing customer redaction:", error);
  }
  return new Response("Customer data redacted successfully", { status: 200 });
};
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7
}, Symbol.toStringTag, { value: "Module" }));
const action$6 = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  if (session) {
    await prisma.session.deleteMany({ where: { shop } });
  }
  return new Response();
};
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6
}, Symbol.toStringTag, { value: "Module" }));
const action$5 = async ({ request }) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for shop: ${shop}`);
  console.log("Shop redaction payload:", payload);
  try {
    const shopId = payload.shop_id;
    const shopDomain = payload.shop_domain;
    console.log(`Redacting all data for shop: ${shopDomain} (ID: ${shopId})`);
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        shop: shopDomain
      }
    });
    console.log(`Deleted ${deletedSessions.count} sessions for shop ${shopDomain}`);
    const submissions = await prisma.submission.findMany({
      where: {
        shop: shopDomain
      }
    });
    console.log(`Found ${submissions.length} submissions for shop ${shopDomain}`);
    const deletedSubmissions = await prisma.submission.deleteMany({
      where: {
        shop: shopDomain
      }
    });
    console.log(`Deleted ${deletedSubmissions.count} submissions for shop ${shopDomain}`);
    console.log({
      type: "GDPR_SHOP_REDACTION",
      shop: shopDomain,
      shopId,
      redactedAt: (/* @__PURE__ */ new Date()).toISOString(),
      sessionsDeleted: deletedSessions.count,
      submissionsDeleted: deletedSubmissions.count
    });
  } catch (error) {
    console.error("Error processing shop redaction:", error);
  }
  return new Response("Shop data redacted successfully", { status: 200 });
};
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5
}, Symbol.toStringTag, { value: "Module" }));
const formSection = "_formSection_g2g60_3";
const form$1 = "_form_g2g60_3";
const formContainer = "_formContainer_g2g60_41";
const formGroup = "_formGroup_g2g60_55";
const formLabel = "_formLabel_g2g60_69";
const required = "_required_g2g60_87";
const formInput = "_formInput_g2g60_99";
const formSelect = "_formSelect_g2g60_101";
const formTextarea = "_formTextarea_g2g60_103";
const characterCount = "_characterCount_g2g60_187";
const inputError = "_inputError_g2g60_203";
const errorMessage = "_errorMessage_g2g60_219";
const submitError = "_submitError_g2g60_235";
const uploadArea = "_uploadArea_g2g60_275";
const fileInput = "_fileInput_g2g60_283";
const uploadLabel = "_uploadLabel_g2g60_291";
const uploadHint = "_uploadHint_g2g60_353";
const previewGrid = "_previewGrid_g2g60_367";
const previewItem = "_previewItem_g2g60_381";
const previewImage = "_previewImage_g2g60_397";
const removeButton = "_removeButton_g2g60_409";
const submitButton = "_submitButton_g2g60_467";
const spinner = "_spinner_g2g60_537";
const styles$5 = {
  formSection,
  form: form$1,
  formContainer,
  formGroup,
  formLabel,
  required,
  formInput,
  formSelect,
  formTextarea,
  characterCount,
  inputError,
  errorMessage,
  submitError,
  uploadArea,
  fileInput,
  uploadLabel,
  uploadHint,
  previewGrid,
  previewItem,
  previewImage,
  removeButton,
  submitButton,
  spinner
};
const US_STATES$1 = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming"
];
const ROAD_USER_TYPES$1 = ["Cyclist", "Pedestrian", "Motorcyclist"];
const INJURY_TYPES$1 = ["Fatal", "Non-fatal"];
const GENDERS$1 = ["Male", "Female", "Non-binary", "Other", "Prefer not to say"];
function FormInput({ label: label2, name, type = "text", placeholder, required: required2, value, onChange, error, maxLength }) {
  return /* @__PURE__ */ jsxs("div", { className: styles$5.formGroup, children: [
    /* @__PURE__ */ jsxs("label", { className: styles$5.formLabel, htmlFor: name, children: [
      label2,
      required2 && /* @__PURE__ */ jsx("span", { className: styles$5.required, children: " *" })
    ] }),
    /* @__PURE__ */ jsx(
      "input",
      {
        id: name,
        name,
        type,
        placeholder,
        value,
        onChange,
        maxLength,
        className: `${styles$5.formInput} ${error ? styles$5.inputError : ""}`,
        required: required2
      }
    ),
    error && /* @__PURE__ */ jsx("p", { className: styles$5.errorMessage, children: error })
  ] });
}
function FormSelect$1({ label: label2, name, options, required: required2, value, onChange, error, placeholder }) {
  return /* @__PURE__ */ jsxs("div", { className: styles$5.formGroup, children: [
    /* @__PURE__ */ jsxs("label", { className: styles$5.formLabel, htmlFor: name, children: [
      label2,
      required2 && /* @__PURE__ */ jsx("span", { className: styles$5.required, children: " *" })
    ] }),
    /* @__PURE__ */ jsxs(
      "select",
      {
        id: name,
        name,
        value,
        onChange,
        className: `${styles$5.formSelect} ${error ? styles$5.inputError : ""}`,
        required: required2,
        children: [
          /* @__PURE__ */ jsx("option", { value: "", children: placeholder || `Select ${label2}` }),
          options.map((option) => /* @__PURE__ */ jsx("option", { value: option, children: option }, option))
        ]
      }
    ),
    error && /* @__PURE__ */ jsx("p", { className: styles$5.errorMessage, children: error })
  ] });
}
function FormTextarea({ label: label2, name, placeholder, required: required2, value, onChange, error, maxLength }) {
  const characterCount2 = value ? value.length : 0;
  return /* @__PURE__ */ jsxs("div", { className: styles$5.formGroup, children: [
    /* @__PURE__ */ jsxs("label", { className: styles$5.formLabel, htmlFor: name, children: [
      label2,
      required2 && /* @__PURE__ */ jsx("span", { className: styles$5.required, children: " *" })
    ] }),
    /* @__PURE__ */ jsx(
      "textarea",
      {
        id: name,
        name,
        placeholder,
        value,
        onChange,
        maxLength,
        className: `${styles$5.formTextarea} ${error ? styles$5.inputError : ""}`,
        required: required2,
        rows: 6
      }
    ),
    maxLength && /* @__PURE__ */ jsxs("div", { className: styles$5.characterCount, children: [
      characterCount2,
      " / ",
      maxLength,
      " characters"
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: styles$5.errorMessage, children: error })
  ] });
}
function ImageUpload({ label: label2, name, required: required2, images, onChange, error, maxImages = 10 }) {
  const [previews, setPreviews] = useState([]);
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = maxImages - images.length;
    if (files.length + images.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }
    const newPreviews = [];
    files.slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({ file, preview: reader.result, id: Date.now() + Math.random() });
          if (newPreviews.length === files.slice(0, remainingSlots).length) {
            setPreviews([...previews, ...newPreviews]);
            onChange([...images, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };
  const handleRemove = (indexToRemove) => {
    const updatedPreviews = previews.filter((_, index) => index !== indexToRemove);
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setPreviews(updatedPreviews);
    onChange(updatedImages);
  };
  useEffect(() => {
    if (images.length === 0) {
      setPreviews([]);
    }
  }, [images]);
  return /* @__PURE__ */ jsxs("div", { className: styles$5.formGroup, children: [
    /* @__PURE__ */ jsxs("label", { className: styles$5.formLabel, children: [
      label2,
      required2 && /* @__PURE__ */ jsx("span", { className: styles$5.required, children: " *" })
    ] }),
    previews.length < maxImages && /* @__PURE__ */ jsxs("div", { className: styles$5.uploadArea, children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          id: name,
          name,
          type: "file",
          accept: "image/*",
          multiple: true,
          onChange: handleFileChange,
          className: styles$5.fileInput
        }
      ),
      /* @__PURE__ */ jsxs("label", { htmlFor: name, className: styles$5.uploadLabel, children: [
        /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" }) }),
        /* @__PURE__ */ jsx("span", { children: "Click to upload photos" }),
        /* @__PURE__ */ jsxs("span", { className: styles$5.uploadHint, children: [
          previews.length,
          " / ",
          maxImages,
          " images uploaded"
        ] })
      ] })
    ] }),
    previews.length > 0 && /* @__PURE__ */ jsx("div", { className: styles$5.previewGrid, children: previews.map((item, index) => /* @__PURE__ */ jsxs("div", { className: styles$5.previewItem, children: [
      /* @__PURE__ */ jsx("img", { src: item.preview, alt: `Preview ${index + 1}`, className: styles$5.previewImage }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => handleRemove(index),
          className: styles$5.removeButton,
          "aria-label": "Remove image",
          children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
            /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
          ] })
        }
      )
    ] }, item.id || index)) }),
    error && /* @__PURE__ */ jsx("p", { className: styles$5.errorMessage, children: error })
  ] });
}
function StorySubmissionForm({ onSubmit, isSubmitting, actionData }) {
  const [formData, setFormData] = useState({
    submitterName: "",
    submitterEmail: "",
    victimName: "",
    relation: "",
    incidentDate: "",
    state: "",
    roadUserType: "",
    injuryType: "",
    age: "",
    gender: "",
    shortTitle: "",
    victimStory: "",
    photos: []
  });
  const [errors, setErrors] = useState({});
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };
  const handleImageChange = (images) => {
    setFormData((prev) => ({
      ...prev,
      photos: images
    }));
  };
  const handleSubmit = (e) => {
    const newErrors = {};
    if (!formData.submitterName) newErrors.submitterName = "Submitter name is required";
    if (!formData.submitterEmail) newErrors.submitterEmail = "Submitter email is required";
    if (!formData.incidentDate) newErrors.incidentDate = "Incident date is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.roadUserType) newErrors.roadUserType = "Road user type is required";
    if (!formData.injuryType) newErrors.injuryType = "Injury type is required";
    if (!formData.shortTitle) newErrors.shortTitle = "Short title is required";
    if (!formData.victimStory) newErrors.victimStory = "Victim's story is required";
    if (Object.keys(newErrors).length > 0) {
      e.preventDefault();
      setErrors(newErrors);
      return;
    }
    const form2 = e.target;
    const existingPhotoInput = form2.querySelector('input[name="photoUrls"]');
    if (existingPhotoInput) {
      existingPhotoInput.remove();
    }
    const photoInput = document.createElement("input");
    photoInput.type = "hidden";
    photoInput.name = "photoUrls";
    if (formData.photos.length > 0) {
      const imageUrls = formData.photos.map((img) => img.preview);
      photoInput.value = JSON.stringify(imageUrls);
    } else {
      photoInput.value = JSON.stringify([]);
    }
    form2.appendChild(photoInput);
  };
  useEffect(() => {
    if (actionData == null ? void 0 : actionData.errors) {
      setErrors(actionData.errors);
    }
  }, [actionData == null ? void 0 : actionData.errors]);
  return /* @__PURE__ */ jsx("div", { className: styles$5.formSection, children: /* @__PURE__ */ jsxs(Form, { method: "post", onSubmit: handleSubmit, className: styles$5.form, children: [
    (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsxs("div", { className: styles$5.submitError, children: [
      /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
        /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
        /* @__PURE__ */ jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
        /* @__PURE__ */ jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
      ] }),
      actionData.error
    ] }),
    /* @__PURE__ */ jsxs("div", { className: styles$5.formContainer, children: [
      /* @__PURE__ */ jsx(
        FormInput,
        {
          label: "Submitter Name",
          name: "submitterName",
          placeholder: "Your full name",
          required: true,
          value: formData.submitterName,
          onChange: handleInputChange,
          error: errors.submitterName
        }
      ),
      /* @__PURE__ */ jsx(
        FormInput,
        {
          label: "Submitter Email",
          name: "submitterEmail",
          type: "email",
          placeholder: "your@email.com",
          required: true,
          value: formData.submitterEmail,
          onChange: handleInputChange,
          error: errors.submitterEmail
        }
      ),
      /* @__PURE__ */ jsx(
        FormInput,
        {
          label: "Victim Name",
          name: "victimName",
          placeholder: "Victim's full name (optional)",
          value: formData.victimName,
          onChange: handleInputChange,
          error: errors.victimName
        }
      ),
      /* @__PURE__ */ jsx(
        FormInput,
        {
          label: "Relation",
          name: "relation",
          placeholder: "Your relationship to the victim (optional)",
          value: formData.relation,
          onChange: handleInputChange,
          error: errors.relation
        }
      ),
      /* @__PURE__ */ jsx(
        FormInput,
        {
          label: "Incident Date",
          name: "incidentDate",
          type: "date",
          required: true,
          value: formData.incidentDate,
          onChange: handleInputChange,
          error: errors.incidentDate
        }
      ),
      /* @__PURE__ */ jsx(
        FormSelect$1,
        {
          label: "State",
          name: "state",
          options: US_STATES$1,
          placeholder: "Select state",
          required: true,
          value: formData.state,
          onChange: handleInputChange,
          error: errors.state
        }
      ),
      /* @__PURE__ */ jsx(
        FormSelect$1,
        {
          label: "Road User Type",
          name: "roadUserType",
          options: ROAD_USER_TYPES$1,
          placeholder: "Select road user type",
          required: true,
          value: formData.roadUserType,
          onChange: handleInputChange,
          error: errors.roadUserType
        }
      ),
      /* @__PURE__ */ jsx(
        FormSelect$1,
        {
          label: "Injury Type",
          name: "injuryType",
          options: INJURY_TYPES$1,
          placeholder: "Select injury type",
          required: true,
          value: formData.injuryType,
          onChange: handleInputChange,
          error: errors.injuryType
        }
      ),
      /* @__PURE__ */ jsx(
        FormInput,
        {
          label: "Age at Incident",
          name: "age",
          type: "number",
          placeholder: "Age (optional)",
          value: formData.age,
          onChange: handleInputChange,
          error: errors.age
        }
      ),
      /* @__PURE__ */ jsx(
        FormSelect$1,
        {
          label: "Gender",
          name: "gender",
          options: GENDERS$1,
          placeholder: "Select gender (optional)",
          value: formData.gender,
          onChange: handleInputChange,
          error: errors.gender
        }
      ),
      /* @__PURE__ */ jsx(
        FormInput,
        {
          label: "Short Title",
          name: "shortTitle",
          placeholder: "Brief title for this story",
          required: true,
          value: formData.shortTitle,
          onChange: handleInputChange,
          error: errors.shortTitle
        }
      ),
      /* @__PURE__ */ jsx(
        FormTextarea,
        {
          label: "Victim's Story",
          name: "victimStory",
          placeholder: "Share the story... (max 1000 characters)",
          required: true,
          maxLength: 1e3,
          value: formData.victimStory,
          onChange: handleInputChange,
          error: errors.victimStory
        }
      ),
      /* @__PURE__ */ jsx(
        ImageUpload,
        {
          label: "Photos",
          name: "photos",
          images: formData.photos,
          onChange: handleImageChange,
          error: errors.photos,
          maxImages: 10
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: styles$5.submitButton,
          disabled: isSubmitting,
          children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: styles$5.spinner }),
            "Submitting..."
          ] }) : "Submit Story"
        }
      )
    ] })
  ] }) });
}
const rateLimitStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1e3);
function checkRateLimit(identifier, maxRequests = 10, windowMs = 60 * 60 * 1e3) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  let data = rateLimitStore.get(key);
  if (!data || data.resetTime < now) {
    data = {
      count: 0,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, data);
  }
  data.count++;
  const allowed = data.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - data.count);
  return {
    allowed,
    remaining,
    resetTime: data.resetTime
  };
}
function getClientIp(request) {
  var _a2;
  const headers2 = request.headers;
  return ((_a2 = headers2.get("x-forwarded-for")) == null ? void 0 : _a2.split(",")[0].trim()) || headers2.get("x-real-ip") || headers2.get("cf-connecting-ip") || // Cloudflare
  headers2.get("x-client-ip") || "unknown";
}
function rateLimitByIp(request, { maxRequests = 10, windowMs = 60 * 60 * 1e3, message = "Too many requests" } = {}) {
  const ip = getClientIp(request);
  const result = checkRateLimit(ip, maxRequests, windowMs);
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: message,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1e3)
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1e3).toString(),
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(result.resetTime).toISOString()
        }
      }
    );
  }
  return null;
}
function rateLimitByEmail(email, { maxRequests = 3, windowMs = 24 * 60 * 60 * 1e3 } = {}) {
  return checkRateLimit(`email:${email.toLowerCase()}`, maxRequests, windowMs);
}
function rateLimitSubmission(request, email, options = {}) {
  const {
    ipMaxRequests = 20,
    // 20 submissions per hour per IP
    ipWindowMs = 60 * 60 * 1e3,
    emailMaxRequests = 3,
    // 3 submissions per day per email
    emailWindowMs = 24 * 60 * 60 * 1e3
  } = options;
  const ipLimit = rateLimitByIp(request, {
    maxRequests: ipMaxRequests,
    windowMs: ipWindowMs,
    message: "Too many submissions from your location. Please try again later."
  });
  if (ipLimit) {
    return ipLimit;
  }
  const emailResult = rateLimitByEmail(email, {
    maxRequests: emailMaxRequests,
    windowMs: emailWindowMs
  });
  if (!emailResult.allowed) {
    return new Response(
      JSON.stringify({
        error: `You can only submit ${emailMaxRequests} stories per day. Please try again later.`,
        retryAfter: Math.ceil((emailResult.resetTime - Date.now()) / 1e3)
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((emailResult.resetTime - Date.now()) / 1e3).toString(),
          "X-RateLimit-Limit": emailMaxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(emailResult.resetTime).toISOString()
        }
      }
    );
  }
  return null;
}
const pageContainer$2 = "_pageContainer_1fjct_3";
const pageHeader$2 = "_pageHeader_1fjct_25";
const backLink = "_backLink_1fjct_41";
const pageTitle$1 = "_pageTitle_1fjct_85";
const pageSubtitle$1 = "_pageSubtitle_1fjct_101";
const successContainer = "_successContainer_1fjct_117";
const successContent = "_successContent_1fjct_135";
const successIcon$1 = "_successIcon_1fjct_155";
const successTitle$1 = "_successTitle_1fjct_189";
const successText = "_successText_1fjct_203";
const successButton$1 = "_successButton_1fjct_217";
const styles$4 = {
  pageContainer: pageContainer$2,
  pageHeader: pageHeader$2,
  backLink,
  pageTitle: pageTitle$1,
  pageSubtitle: pageSubtitle$1,
  successContainer,
  successContent,
  successIcon: successIcon$1,
  successTitle: successTitle$1,
  successText,
  successButton: successButton$1
};
async function action$4({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const formData = await request.formData();
    const submitterName2 = formData.get("submitterName");
    const submitterEmail2 = formData.get("submitterEmail");
    if (submitterEmail2) {
      const rateLimitResponse = rateLimitSubmission(request, submitterEmail2);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }
    const victimName2 = formData.get("victimName");
    const relation2 = formData.get("relation");
    const incidentDate = formData.get("incidentDate");
    const state = formData.get("state");
    const roadUserType = formData.get("roadUserType");
    const injuryType = formData.get("injuryType");
    const age = formData.get("age");
    const gender = formData.get("gender");
    const shortTitle = formData.get("shortTitle");
    const victimStory = formData.get("victimStory");
    const errors = {};
    if (!submitterName2) errors.submitterName = "Submitter name is required";
    if (!submitterEmail2) errors.submitterEmail = "Submitter email is required";
    if (!incidentDate) errors.incidentDate = "Incident date is required";
    if (!state) errors.state = "State is required";
    if (!roadUserType) errors.roadUserType = "Road user type is required";
    if (!injuryType) errors.injuryType = "Injury type is required";
    if (!shortTitle) errors.shortTitle = "Short title is required";
    if (!victimStory) errors.victimStory = "Victim's story is required";
    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 });
    }
    return json(
      {
        success: true,
        message: "Your submission has been received. Thank you for sharing this story."
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Form submission error:", error);
    return json(
      {
        error: "An error occurred while submitting. Please try again."
      },
      { status: 500 }
    );
  }
}
const meta$3 = () => [
  { title: "Submit a Story | Lives Stolen" },
  {
    name: "description",
    content: "Share a story of a traffic collision victim"
  }
];
function SubmitStoryPage() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  if (actionData == null ? void 0 : actionData.success) {
    return /* @__PURE__ */ jsx("div", { className: styles$4.pageContainer, children: /* @__PURE__ */ jsx("div", { className: styles$4.successContainer, children: /* @__PURE__ */ jsxs("div", { className: styles$4.successContent, children: [
      /* @__PURE__ */ jsx("div", { className: styles$4.successIcon, children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ jsx("path", { d: "M20 6L9 17l-5-5" }) }) }),
      /* @__PURE__ */ jsx("h2", { className: styles$4.successTitle, children: "Thank You" }),
      /* @__PURE__ */ jsx("p", { className: styles$4.successText, children: (actionData == null ? void 0 : actionData.message) || "Your submission has been received. We appreciate you sharing this story." }),
      /* @__PURE__ */ jsx(Link, { to: "/stories", className: styles$4.successButton, children: "Return to Memorial Wall" })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: styles$4.pageContainer, children: [
    /* @__PURE__ */ jsxs("header", { className: styles$4.pageHeader, children: [
      /* @__PURE__ */ jsxs(Link, { to: "/stories", className: styles$4.backLink, children: [
        /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M19 12H5M12 19l-7-7 7-7" }) }),
        "Back to Stories"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: styles$4.pageTitle, children: "Lost someone you love to traffic violence?" }),
      /* @__PURE__ */ jsx("p", { className: styles$4.pageSubtitle, children: "Honor their memory. Share their story." })
    ] }),
    /* @__PURE__ */ jsx(
      StorySubmissionForm,
      {
        isSubmitting,
        actionData
      }
    )
  ] });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: SubmitStoryPage,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
const ToastContext = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, options = {}) => {
    const {
      type = "success",
      position = "top-right",
      duration = 3e3
    } = options;
    const id = Date.now() + Math.random();
    const toast = { id, message, type, position };
    setToasts((prev) => [...prev, toast]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);
  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return /* @__PURE__ */ jsxs(ToastContext.Provider, { value: { showToast, hideToast }, children: [
    children,
    /* @__PURE__ */ jsx(ToastContainer, { toasts, onClose: hideToast })
  ] });
}
function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
function ToastContainer({ toasts, onClose }) {
  const groupedToasts = toasts.reduce((acc, toast) => {
    if (!acc[toast.position]) {
      acc[toast.position] = [];
    }
    acc[toast.position].push(toast);
    return acc;
  }, {});
  return /* @__PURE__ */ jsx(Fragment, { children: Object.entries(groupedToasts).map(([position, toastList]) => /* @__PURE__ */ jsx("div", { style: getContainerStyle(position), children: toastList.map((toast) => /* @__PURE__ */ jsx(Toast, { toast, onClose }, toast.id)) }, position)) });
}
function Toast({ toast, onClose }) {
  const styles2 = getToastStyles(toast.type);
  return /* @__PURE__ */ jsxs("div", { style: styles2.container, children: [
    /* @__PURE__ */ jsx("div", { style: styles2.iconWrapper, children: getIcon(toast.type) }),
    /* @__PURE__ */ jsx("p", { style: styles2.message, children: toast.message }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => onClose(toast.id),
        style: styles2.closeButton,
        "aria-label": "Close",
        children: "×"
      }
    )
  ] });
}
function getContainerStyle(position) {
  const baseStyle = {
    position: "fixed",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "20px",
    pointerEvents: "none"
  };
  const positions = {
    "top-left": { top: 0, left: 0 },
    "top-center": { top: 0, left: "50%", transform: "translateX(-50%)" },
    "top-right": { top: 0, right: 0 },
    "bottom-left": { bottom: 0, left: 0 },
    "bottom-center": { bottom: 0, left: "50%", transform: "translateX(-50%)" },
    "bottom-right": { bottom: 0, right: 0 }
  };
  return { ...baseStyle, ...positions[position] };
}
function getToastStyles(type) {
  const colors = {
    success: { bg: "#10b981", icon: "#dcfce7", text: "#fff" },
    danger: { bg: "#ef4444", icon: "#fee2e2", text: "#fff" },
    warning: { bg: "#f59e0b", icon: "#fef3c7", text: "#fff" },
    info: { bg: "#3b82f6", icon: "#dbeafe", text: "#fff" },
    pending: { bg: "#6b7280", icon: "#f3f4f6", text: "#fff" }
  };
  const color = colors[type] || colors.info;
  return {
    container: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      background: color.bg,
      color: color.text,
      padding: "14px 16px",
      borderRadius: "8px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      minWidth: "320px",
      maxWidth: "420px",
      pointerEvents: "auto",
      animation: "slideIn 0.3s ease-out, fadeIn 0.3s ease-out"
    },
    iconWrapper: {
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      background: color.icon,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      fontSize: "14px"
    },
    message: {
      flex: 1,
      margin: 0,
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "1.5"
    },
    closeButton: {
      background: "transparent",
      border: "none",
      color: color.text,
      fontSize: "24px",
      cursor: "pointer",
      padding: "0",
      width: "24px",
      height: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.7,
      transition: "opacity 0.2s",
      flexShrink: 0
    }
  };
}
function getIcon(type) {
  const icons = {
    success: "✓",
    danger: "✕",
    warning: "⚠",
    info: "ℹ",
    pending: "⋯"
  };
  return icons[type] || icons.info;
}
function ToastStyles() {
  return /* @__PURE__ */ jsx("style", { children: `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      button:hover {
        opacity: 1 !important;
      }
    ` });
}
const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming"
];
const ROAD_USER_TYPES = ["Cyclist", "Pedestrian", "Motorcyclist"];
const INJURY_TYPES = ["Fatal", "Non-fatal"];
const GENDERS = ["Male", "Female", "Non-binary", "Other", "Prefer not to say"];
const loader$a = async () => {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
    const parsedSubmissions = submissions.map((sub) => ({
      ...sub,
      photoUrls: sub.photoUrls ? JSON.parse(sub.photoUrls) : []
    }));
    return json({ submissions: parsedSubmissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return json({ submissions: [], error: error.message });
  }
};
const action$3 = async ({ request }) => {
  const formData = await request.formData();
  const action2 = formData.get("action");
  const submissionId = formData.get("submissionId");
  if (!submissionId) {
    return json({ error: "Missing submission ID" }, { status: 400 });
  }
  try {
    if (action2 === "update") {
      const updateData = {
        submitterName: formData.get("submitterName"),
        submitterEmail: formData.get("submitterEmail"),
        victimName: formData.get("victimName") || null,
        relation: formData.get("relation") || null,
        incidentDate: formData.get("incidentDate"),
        state: formData.get("state"),
        roadUserType: formData.get("roadUserType"),
        injuryType: formData.get("injuryType"),
        age: formData.get("age") ? parseInt(formData.get("age")) : null,
        gender: formData.get("gender") || null,
        shortTitle: formData.get("shortTitle"),
        victimStory: formData.get("victimStory")
      };
      const photoUrlsString = formData.get("photoUrls");
      if (photoUrlsString) {
        updateData.photoUrls = photoUrlsString;
      }
      const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: updateData
      });
      return json({ success: true, submission: updatedSubmission, updated: true });
    } else {
      const status = formData.get("status");
      if (!status) {
        return json({ error: "Missing status" }, { status: 400 });
      }
      const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status,
          publishedAt: status === "published" ? /* @__PURE__ */ new Date() : null
        }
      });
      return json({ success: true, submission: updatedSubmission });
    }
  } catch (error) {
    console.error("Error updating submission:", error);
    return json({ error: error.message }, { status: 500 });
  }
};
function AdminSubmissionsPage() {
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    /* @__PURE__ */ jsx(ToastStyles, {}),
    /* @__PURE__ */ jsx(AdminSubmissionsContent, {})
  ] });
}
function AdminSubmissionsContent() {
  const { submissions, error } = useLoaderData();
  if (error) {
    return /* @__PURE__ */ jsxs("div", { style: { padding: "40px", maxWidth: "1200px", margin: "0 auto" }, children: [
      /* @__PURE__ */ jsx("h1", { style: { fontSize: "2rem", marginBottom: "20px", color: "#dc2626" }, children: "Error Loading Submissions" }),
      /* @__PURE__ */ jsx("p", { children: error })
    ] });
  }
  const statusCounts = {
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    published: submissions.filter((s) => s.status === "published").length,
    rejected: submissions.filter((s) => s.status === "rejected").length
  };
  return /* @__PURE__ */ jsxs("div", { style: { padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { marginBottom: "40px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }, children: [
        /* @__PURE__ */ jsx("h1", { style: { fontSize: "2rem", fontWeight: "bold", margin: 0 }, children: "Story Submissions" }),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/stories",
            style: {
              padding: "10px 20px",
              background: "#000",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600"
            },
            children: "View Stories Page"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { style: { color: "#666", margin: 0 }, children: "All story submissions from your database" })
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "40px"
        },
        children: [
          /* @__PURE__ */ jsx(StatCard, { label: "Total", count: submissions.length, color: "#3b82f6" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Pending", count: statusCounts.pending, color: "#f59e0b" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Approved", count: statusCounts.approved, color: "#10b981" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Published", count: statusCounts.published, color: "#8b5cf6" })
        ]
      }
    ),
    submissions.length === 0 ? /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          padding: "60px 20px",
          textAlign: "center",
          background: "#f9f9f9",
          borderRadius: "12px",
          border: "2px dashed #ddd"
        },
        children: /* @__PURE__ */ jsx("p", { style: { fontSize: "1.1rem", color: "#666", margin: 0 }, children: "No submissions yet. Submit a story to see it here!" })
      }
    ) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "20px" }, children: submissions.map((submission) => /* @__PURE__ */ jsx(SubmissionCard$1, { submission }, submission.id)) })
  ] });
}
function StatCard({ label: label2, count: count2, color }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        padding: "24px",
        background: "#fff",
        border: "2px solid #e5e5e5",
        borderRadius: "12px"
      },
      children: [
        /* @__PURE__ */ jsx("p", { style: { fontSize: "0.9rem", color: "#666", margin: "0 0 8px 0" }, children: label2 }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: "2rem", fontWeight: "bold", color, margin: 0 }, children: count2 })
      ]
    }
  );
}
function SubmissionCard$1({ submission }) {
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const [modal, setModal] = useState({ isOpen: false, action: null, message: "" });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const previousStatusRef = useRef(null);
  const statusColors = {
    pending: "#f59e0b",
    approved: "#10b981",
    published: "#8b5cf6",
    rejected: "#ef4444"
  };
  const isUpdating = fetcher.state !== "idle";
  useEffect(() => {
    var _a2;
    if (((_a2 = fetcher.data) == null ? void 0 : _a2.success) && fetcher.state === "idle") {
      if (fetcher.data.updated) {
        showToast("Story updated successfully!", { type: "success", position: "top-right" });
        setIsEditing(false);
        return;
      }
      const newStatus = fetcher.data.submission.status;
      if (previousStatusRef.current !== newStatus) {
        previousStatusRef.current = newStatus;
        const messages = {
          approved: { text: "Story approved successfully!", type: "success" },
          rejected: { text: "Story rejected successfully!", type: "danger" },
          published: { text: "Story published successfully!", type: "success" }
        };
        const msg = messages[newStatus] || { text: "Status updated!", type: "info" };
        showToast(msg.text, { type: msg.type, position: "top-right" });
      }
    }
  }, [fetcher.data, fetcher.state, showToast]);
  const openConfirmation = (action2) => {
    const messages = {
      approved: "Do you want to approve this story?",
      rejected: "Do you want to reject this story?",
      published: "Do you want to publish this story?"
    };
    setModal({ isOpen: true, action: action2, message: messages[action2] });
  };
  const handleConfirm = () => {
    fetcher.submit(
      {
        submissionId: submission.id,
        status: modal.action
      },
      { method: "post" }
    );
    setModal({ isOpen: false, action: null, message: "" });
  };
  const handleCancel = () => {
    setModal({ isOpen: false, action: null, message: "" });
  };
  const handleEdit = () => {
    setEditData({
      submitterName: submission.submitterName || "",
      submitterEmail: submission.submitterEmail || "",
      victimName: submission.victimName || "",
      relation: submission.relation || "",
      incidentDate: submission.incidentDate || "",
      state: submission.state || "",
      roadUserType: submission.roadUserType || "",
      injuryType: submission.injuryType || "",
      age: submission.age || "",
      gender: submission.gender || "",
      shortTitle: submission.shortTitle || "",
      victimStory: submission.victimStory || "",
      photoUrls: submission.photoUrls || []
    });
    setIsEditing(true);
    setIsExpanded(true);
  };
  const handleSaveEdit = (formData) => {
    fetcher.submit(
      {
        ...formData,
        submissionId: submission.id,
        action: "update"
      },
      { method: "post" }
    );
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        background: "#fff",
        border: "2px solid #e5e5e5",
        borderRadius: "12px",
        padding: "24px",
        opacity: isUpdating ? 0.6 : 1,
        transition: "all 0.3s ease"
      },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px", gap: "12px" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.25rem", fontWeight: "600", margin: "0 0 8px 0" }, children: submission.shortTitle }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "12px", fontSize: "0.9rem", color: "#666", flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "📍 ",
                submission.state
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                "📅 ",
                submission.incidentDate
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                "🚴 ",
                submission.roadUserType
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                "⚠️ ",
                submission.injuryType
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setIsExpanded(!isExpanded),
                style: {
                  padding: "8px 16px",
                  background: isExpanded ? "#000" : "#fff",
                  color: isExpanded ? "#fff" : "#000",
                  border: "2px solid #000",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                },
                children: [
                  /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                    /* @__PURE__ */ jsx("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
                    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3" })
                  ] }),
                  isExpanded ? "Hide" : "View"
                ]
              }
            ),
            !isEditing && /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleEdit,
                style: {
                  padding: "8px 16px",
                  background: "#fff",
                  color: "#000",
                  border: "2px solid #000",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                },
                children: [
                  /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                    /* @__PURE__ */ jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
                    /* @__PURE__ */ jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })
                  ] }),
                  "Edit"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  padding: "6px 12px",
                  background: statusColors[submission.status] || "#999",
                  color: "#fff",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textTransform: "capitalize"
                },
                children: submission.status
              }
            )
          ] })
        ] }),
        !isExpanded && /* @__PURE__ */ jsx("div", { style: { marginBottom: "16px" }, children: /* @__PURE__ */ jsx("p", { style: { color: "#333", lineHeight: "1.6", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }, children: submission.victimStory }) }),
        isExpanded && /* @__PURE__ */ jsx("div", { style: {
          marginTop: "24px",
          paddingTop: "24px",
          borderTop: "2px solid #e5e5e5",
          animation: "fadeIn 0.3s ease"
        }, children: isEditing ? /* @__PURE__ */ jsx(
          InlineEditForm,
          {
            editData,
            setEditData,
            handleSaveEdit,
            handleCancelEdit,
            isUpdating
          }
        ) : /* @__PURE__ */ jsx(StoryDetailView, { submission }) }),
        !isEditing && /* @__PURE__ */ jsxs(Fragment, { children: [
          (submission.status === "pending" || submission.status === "rejected") && /* @__PURE__ */ jsxs(
            "div",
            {
              style: {
                display: "flex",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e5e5",
                flexWrap: "wrap",
                marginTop: "16px"
              },
              children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => openConfirmation("approved"),
                    disabled: isUpdating,
                    style: {
                      padding: "10px 20px",
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: isUpdating ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      transition: "background 0.2s"
                    },
                    onMouseEnter: (e) => !isUpdating && (e.target.style.background = "#059669"),
                    onMouseLeave: (e) => !isUpdating && (e.target.style.background = "#10b981"),
                    children: "Approve"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => openConfirmation("rejected"),
                    disabled: isUpdating,
                    style: {
                      padding: "10px 20px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: isUpdating ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      transition: "background 0.2s"
                    },
                    onMouseEnter: (e) => !isUpdating && (e.target.style.background = "#dc2626"),
                    onMouseLeave: (e) => !isUpdating && (e.target.style.background = "#ef4444"),
                    children: "Reject"
                  }
                )
              ]
            }
          ),
          submission.status === "approved" && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                display: "flex",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e5e5",
                marginTop: "16px"
              },
              children: /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => openConfirmation("published"),
                  disabled: isUpdating,
                  style: {
                    padding: "10px 20px",
                    background: "#8b5cf6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: isUpdating ? "not-allowed" : "pointer",
                    fontSize: "0.9rem",
                    transition: "background 0.2s"
                  },
                  onMouseEnter: (e) => !isUpdating && (e.target.style.background = "#7c3aed"),
                  onMouseLeave: (e) => !isUpdating && (e.target.style.background = "#8b5cf6"),
                  children: "Publish"
                }
              )
            }
          ),
          submission.status === "published" && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                paddingTop: "16px",
                borderTop: "1px solid #e5e5e5",
                textAlign: "center",
                color: "#8b5cf6",
                fontWeight: "600",
                marginTop: "16px"
              },
              children: "✓ This story has been published"
            }
          )
        ] }),
        modal.isOpen && /* @__PURE__ */ jsx(
          ConfirmationModal,
          {
            message: modal.message,
            onConfirm: handleConfirm,
            onCancel: handleCancel
          }
        )
      ]
    }
  );
}
function StoryDetailView({ submission }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "24px" }, children: [
    submission.photoUrls && submission.photoUrls.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h4", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "12px", color: "#000" }, children: [
        "Photos (",
        submission.photoUrls.length,
        ")"
      ] }),
      /* @__PURE__ */ jsx("div", { style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "12px"
      }, children: submission.photoUrls.map((url, index) => /* @__PURE__ */ jsx(
        "div",
        {
          style: {
            position: "relative",
            paddingBottom: "100%",
            background: "#f3f4f6",
            borderRadius: "8px",
            overflow: "hidden",
            border: "2px solid #e5e5e5"
          },
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: url,
              alt: `Photo ${index + 1}`,
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }
            }
          )
        },
        index
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "12px", color: "#000" }, children: "Story" }),
      /* @__PURE__ */ jsx("p", { style: { color: "#333", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap" }, children: submission.victimStory })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      padding: "20px",
      background: "#f9fafb",
      borderRadius: "8px",
      border: "1px solid #e5e7eb"
    }, children: [
      /* @__PURE__ */ jsx("h4", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000" }, children: "Submitter Information" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }, children: [
        /* @__PURE__ */ jsx(InfoRow, { label: "Submitter Name", value: submission.submitterName }),
        /* @__PURE__ */ jsx(InfoRow, { label: "Submitter Email", value: submission.submitterEmail }),
        submission.victimName && /* @__PURE__ */ jsx(InfoRow, { label: "Victim Name", value: submission.victimName }),
        submission.relation && /* @__PURE__ */ jsx(InfoRow, { label: "Relation", value: submission.relation }),
        submission.age && /* @__PURE__ */ jsx(InfoRow, { label: "Age", value: submission.age }),
        submission.gender && /* @__PURE__ */ jsx(InfoRow, { label: "Gender", value: submission.gender })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      padding: "20px",
      background: "#fefce8",
      borderRadius: "8px",
      border: "1px solid #fef08a"
    }, children: [
      /* @__PURE__ */ jsx("h4", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000" }, children: "Incident Details" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }, children: [
        /* @__PURE__ */ jsx(InfoRow, { label: "Incident Date", value: submission.incidentDate }),
        /* @__PURE__ */ jsx(InfoRow, { label: "State", value: submission.state }),
        /* @__PURE__ */ jsx(InfoRow, { label: "Road User Type", value: submission.roadUserType }),
        /* @__PURE__ */ jsx(InfoRow, { label: "Injury Type", value: submission.injuryType })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: {
      padding: "16px",
      background: "#f3f4f6",
      borderRadius: "8px",
      fontSize: "0.85rem",
      color: "#666"
    }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Database ID:" }),
        " ",
        submission.id
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Submitted:" }),
        " ",
        new Date(submission.createdAt).toLocaleString()
      ] }),
      submission.metaobjectId && /* @__PURE__ */ jsx("div", { style: { color: "#10b981" }, children: /* @__PURE__ */ jsx("strong", { children: "✅ Synced to Shopify" }) })
    ] }) })
  ] });
}
function InfoRow({ label: label2, value }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: "0.85rem", fontWeight: "600", color: "#666", marginBottom: "4px" }, children: label2 }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: "0.95rem", color: "#000" }, children: value || "—" })
  ] });
}
function ImageUploadManager({ existingImages, setExistingImages, newImages, setNewImages, maxImages }) {
  const fileInputRef = useRef(null);
  const totalImages = existingImages.length + newImages.length;
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = maxImages - totalImages;
    if (files.length + totalImages > maxImages) {
      alert(`You can only upload up to ${maxImages} images total`);
      return;
    }
    const newPreviews = [];
    files.slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({ file, preview: reader.result, id: Date.now() + Math.random() });
          if (newPreviews.length === files.slice(0, remainingSlots).length) {
            setNewImages([...newImages, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleRemoveExisting = (indexToRemove) => {
    const updatedImages = existingImages.filter((_, index) => index !== indexToRemove);
    setExistingImages(updatedImages);
  };
  const handleRemoveNew = (indexToRemove) => {
    const updatedImages = newImages.filter((_, index) => index !== indexToRemove);
    setNewImages(updatedImages);
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    totalImages < maxImages && /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          border: "2px dashed #000",
          borderRadius: "8px",
          padding: "32px",
          textAlign: "center",
          background: "#f9fafb",
          marginBottom: "16px",
          cursor: "pointer",
          transition: "all 0.2s"
        },
        onClick: () => {
          var _a2;
          return (_a2 = fileInputRef.current) == null ? void 0 : _a2.click();
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#f3f4f6";
          e.currentTarget.style.borderColor = "#666";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "#f9fafb";
          e.currentTarget.style.borderColor = "#000";
        },
        children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/*",
              multiple: true,
              onChange: handleFileChange,
              style: { display: "none" }
            }
          ),
          /* @__PURE__ */ jsx("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", style: { margin: "0 auto 12px" }, children: /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" }) }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "8px", color: "#000" }, children: "Click to upload photos" }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.9rem", color: "#666" }, children: [
            totalImages,
            " / ",
            maxImages,
            " images uploaded"
          ] })
        ]
      }
    ),
    (existingImages.length > 0 || newImages.length > 0) && /* @__PURE__ */ jsxs("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
      gap: "12px"
    }, children: [
      existingImages.map((url, index) => /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            position: "relative",
            paddingBottom: "100%",
            background: "#f3f4f6",
            borderRadius: "8px",
            overflow: "hidden",
            border: "2px solid #e5e5e5"
          },
          children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: url,
                alt: `Existing ${index + 1}`,
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleRemoveExisting(index),
                style: {
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                },
                onMouseEnter: (e) => {
                  e.target.style.background = "#dc2626";
                  e.target.style.transform = "scale(1.1)";
                },
                onMouseLeave: (e) => {
                  e.target.style.background = "#ef4444";
                  e.target.style.transform = "scale(1)";
                },
                children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                  /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                  /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                ] })
              }
            )
          ]
        },
        `existing-${index}`
      )),
      newImages.map((item, index) => /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            position: "relative",
            paddingBottom: "100%",
            background: "#f3f4f6",
            borderRadius: "8px",
            overflow: "hidden",
            border: "2px solid #10b981"
          },
          children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: item.preview,
                alt: `New ${index + 1}`,
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }
              }
            ),
            /* @__PURE__ */ jsx("div", { style: {
              position: "absolute",
              top: "8px",
              left: "8px",
              background: "#10b981",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: "600"
            }, children: "NEW" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleRemoveNew(index),
                style: {
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                },
                onMouseEnter: (e) => {
                  e.target.style.background = "#dc2626";
                  e.target.style.transform = "scale(1.1)";
                },
                onMouseLeave: (e) => {
                  e.target.style.background = "#ef4444";
                  e.target.style.transform = "scale(1)";
                },
                children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                  /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                  /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                ] })
              }
            )
          ]
        },
        item.id || `new-${index}`
      ))
    ] }),
    totalImages === 0 && /* @__PURE__ */ jsx("div", { style: {
      padding: "24px",
      textAlign: "center",
      color: "#666",
      fontSize: "0.9rem",
      background: "#f9fafb",
      borderRadius: "8px",
      border: "1px solid #e5e5e5"
    }, children: "No photos uploaded yet" })
  ] });
}
function InlineEditForm({ editData, setEditData, handleSaveEdit, handleCancelEdit, isUpdating }) {
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState(editData.photoUrls || []);
  const handleChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const allImages = [...existingImages, ...images.map((img) => img.preview)];
    const updatedFormData = {
      ...editData,
      photoUrls: JSON.stringify(allImages)
    };
    handleSaveEdit(updatedFormData);
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleFormSubmit, style: { display: "flex", flexDirection: "column", gap: "24px" }, children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }, children: "Photos" }),
      /* @__PURE__ */ jsx(
        ImageUploadManager,
        {
          existingImages,
          setExistingImages,
          newImages: images,
          setNewImages: setImages,
          maxImages: 10
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }, children: "Story Details" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: [
        /* @__PURE__ */ jsx(
          FormField,
          {
            label: "Short Title",
            required: true,
            value: editData.shortTitle,
            onChange: (e) => handleChange("shortTitle", e.target.value),
            placeholder: "Brief title for this story"
          }
        ),
        /* @__PURE__ */ jsx(
          FormField,
          {
            label: "Victim's Story",
            required: true,
            type: "textarea",
            value: editData.victimStory,
            onChange: (e) => handleChange("victimStory", e.target.value),
            placeholder: "Share the story...",
            maxLength: 1e3
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }, children: "Submitter Information" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }, children: [
        /* @__PURE__ */ jsx(
          FormField,
          {
            label: "Submitter Name",
            required: true,
            value: editData.submitterName,
            onChange: (e) => handleChange("submitterName", e.target.value),
            placeholder: "Full name"
          }
        ),
        /* @__PURE__ */ jsx(
          FormField,
          {
            label: "Submitter Email",
            required: true,
            type: "email",
            value: editData.submitterEmail,
            onChange: (e) => handleChange("submitterEmail", e.target.value),
            placeholder: "email@example.com"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }, children: "Victim Information" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }, children: [
        /* @__PURE__ */ jsx(
          FormField,
          {
            label: "Victim Name",
            value: editData.victimName,
            onChange: (e) => handleChange("victimName", e.target.value),
            placeholder: "Victim's full name (optional)"
          }
        ),
        /* @__PURE__ */ jsx(
          FormField,
          {
            label: "Relation",
            value: editData.relation,
            onChange: (e) => handleChange("relation", e.target.value),
            placeholder: "Relationship to victim (optional)"
          }
        ),
        /* @__PURE__ */ jsx(
          FormField,
          {
            label: "Age",
            type: "number",
            value: editData.age,
            onChange: (e) => handleChange("age", e.target.value),
            placeholder: "Age (optional)"
          }
        ),
        /* @__PURE__ */ jsx(
          FormSelect,
          {
            label: "Gender",
            value: editData.gender,
            onChange: (e) => handleChange("gender", e.target.value),
            options: GENDERS,
            placeholder: "Select gender (optional)"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { style: { fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }, children: "Incident Details" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }, children: [
        /* @__PURE__ */ jsx(
          FormField,
          {
            label: "Incident Date",
            required: true,
            type: "date",
            value: editData.incidentDate,
            onChange: (e) => handleChange("incidentDate", e.target.value)
          }
        ),
        /* @__PURE__ */ jsx(
          FormSelect,
          {
            label: "State",
            required: true,
            value: editData.state,
            onChange: (e) => handleChange("state", e.target.value),
            options: US_STATES,
            placeholder: "Select state"
          }
        ),
        /* @__PURE__ */ jsx(
          FormSelect,
          {
            label: "Road User Type",
            required: true,
            value: editData.roadUserType,
            onChange: (e) => handleChange("roadUserType", e.target.value),
            options: ROAD_USER_TYPES,
            placeholder: "Select road user type"
          }
        ),
        /* @__PURE__ */ jsx(
          FormSelect,
          {
            label: "Injury Type",
            required: true,
            value: editData.injuryType,
            onChange: (e) => handleChange("injuryType", e.target.value),
            options: INJURY_TYPES,
            placeholder: "Select injury type"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      gap: "12px",
      justifyContent: "flex-end",
      paddingTop: "16px",
      borderTop: "2px solid #e5e5e5"
    }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleCancelEdit,
          disabled: isUpdating,
          style: {
            padding: "12px 32px",
            background: "#f3f4f6",
            color: "#333",
            border: "2px solid #e5e5e5",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: isUpdating ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          },
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: isUpdating,
          style: {
            padding: "12px 32px",
            background: "#000",
            color: "#fff",
            border: "2px solid #000",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: isUpdating ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          },
          children: isUpdating ? "Saving..." : "Save Changes"
        }
      )
    ] })
  ] });
}
function FormField({ label: label2, required: required2, type = "text", value, onChange, placeholder, maxLength }) {
  const characterCount2 = value ? value.length : 0;
  const isTextarea = type === "textarea";
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("label", { style: {
      fontSize: "0.9rem",
      fontWeight: "600",
      color: "#000",
      marginBottom: "8px",
      display: "block"
    }, children: [
      label2,
      required2 && /* @__PURE__ */ jsx("span", { style: { color: "#dc2626", fontWeight: "700" }, children: " *" })
    ] }),
    isTextarea ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "textarea",
        {
          value,
          onChange,
          placeholder,
          maxLength,
          required: required2,
          rows: 6,
          style: {
            width: "100%",
            padding: "12px 16px",
            background: "#ffffff",
            color: "#000",
            border: "2px solid #000",
            borderRadius: "6px",
            fontSize: "1rem",
            fontFamily: "inherit",
            resize: "vertical",
            minHeight: "120px",
            lineHeight: "1.5",
            transition: "all 0.2s ease"
          }
        }
      ),
      maxLength && /* @__PURE__ */ jsxs("div", { style: {
        fontSize: "0.85rem",
        color: "#666",
        textAlign: "right",
        marginTop: "4px"
      }, children: [
        characterCount2,
        " / ",
        maxLength,
        " characters"
      ] })
    ] }) : /* @__PURE__ */ jsx(
      "input",
      {
        type,
        value,
        onChange,
        placeholder,
        maxLength,
        required: required2,
        style: {
          width: "100%",
          padding: "12px 16px",
          background: "#ffffff",
          color: "#000",
          border: "2px solid #000",
          borderRadius: "6px",
          fontSize: "1rem",
          fontFamily: "inherit",
          transition: "all 0.2s ease"
        }
      }
    )
  ] });
}
function FormSelect({ label: label2, required: required2, value, onChange, options, placeholder }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("label", { style: {
      fontSize: "0.9rem",
      fontWeight: "600",
      color: "#000",
      marginBottom: "8px",
      display: "block"
    }, children: [
      label2,
      required2 && /* @__PURE__ */ jsx("span", { style: { color: "#dc2626", fontWeight: "700" }, children: " *" })
    ] }),
    /* @__PURE__ */ jsxs(
      "select",
      {
        value,
        onChange,
        required: required2,
        style: {
          width: "100%",
          padding: "12px 16px",
          background: "#ffffff",
          color: "#000",
          border: "2px solid #000",
          borderRadius: "6px",
          fontSize: "1rem",
          fontFamily: "inherit",
          cursor: "pointer",
          transition: "all 0.2s ease"
        },
        children: [
          /* @__PURE__ */ jsx("option", { value: "", children: placeholder || `Select ${label2}` }),
          options.map((option) => /* @__PURE__ */ jsx("option", { value: option, children: option }, option))
        ]
      }
    )
  ] });
}
function ConfirmationModal({ message, onConfirm, onCancel }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1e3
      },
      onClick: onCancel,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            background: "#fff",
            borderRadius: "12px",
            padding: "30px",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          },
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#333" }, children: "Confirm Action" }),
            /* @__PURE__ */ jsx("p", { style: { color: "#666", marginBottom: "24px", lineHeight: "1.6" }, children: message }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "12px", justifyContent: "flex-end" }, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onCancel,
                  style: {
                    padding: "10px 24px",
                    background: "#f3f4f6",
                    color: "#333",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "background 0.2s"
                  },
                  onMouseEnter: (e) => e.target.style.background = "#e5e7eb",
                  onMouseLeave: (e) => e.target.style.background = "#f3f4f6",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onConfirm,
                  style: {
                    padding: "10px 24px",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "background 0.2s"
                  },
                  onMouseEnter: (e) => e.target.style.background = "#2563eb",
                  onMouseLeave: (e) => e.target.style.background = "#3b82f6",
                  children: "OK"
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  if (!document.querySelector("style[data-admin-animations]")) {
    style.setAttribute("data-admin-animations", "true");
    document.head.appendChild(style);
  }
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: AdminSubmissionsPage,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
function TermsOfService() {
  return /* @__PURE__ */ jsxs("div", { style: { maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }, children: [
    /* @__PURE__ */ jsx("h1", { style: { fontSize: "2rem", marginBottom: "1rem" }, children: "Terms of Service" }),
    /* @__PURE__ */ jsxs("p", { style: { color: "#666", marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("strong", { children: "Last Updated:" }),
      " ",
      (/* @__PURE__ */ new Date()).toLocaleDateString()
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "1. Agreement to Terms" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: 'By installing and using Story App ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not install or use the App.' })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "2. Description of Service" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "Story App is a Shopify application that enables merchants to:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsx("li", { children: "Collect and display memorial stories from users" }),
        /* @__PURE__ */ jsx("li", { children: "Manage story submissions through an admin dashboard" }),
        /* @__PURE__ */ jsx("li", { children: "Publish approved stories on a public memorial wall" }),
        /* @__PURE__ */ jsx("li", { children: "Sync stories with Shopify store data" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "3. Eligibility" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "You must:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsx("li", { children: "Be at least 18 years old" }),
        /* @__PURE__ */ jsx("li", { children: "Have a valid Shopify store" }),
        /* @__PURE__ */ jsx("li", { children: "Have the authority to bind your business to these terms" }),
        /* @__PURE__ */ jsx("li", { children: "Comply with all applicable laws and regulations" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "4. Your Responsibilities" }),
      /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.2rem", marginBottom: "0.5rem" }, children: "4.1 Content Moderation" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginBottom: "1rem" }, children: "As a merchant using this app, you are responsible for:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsx("li", { children: "Reviewing all submitted stories before publication" }),
        /* @__PURE__ */ jsx("li", { children: "Ensuring published content complies with applicable laws" }),
        /* @__PURE__ */ jsx("li", { children: "Removing inappropriate, offensive, or illegal content" }),
        /* @__PURE__ */ jsx("li", { children: "Respecting the privacy of story submitters" }),
        /* @__PURE__ */ jsx("li", { children: "Handling user data in compliance with privacy laws" })
      ] }),
      /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.2rem", marginBottom: "0.5rem", marginTop: "1rem" }, children: "4.2 Prohibited Uses" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginBottom: "0.5rem" }, children: "You may not use the App to:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsx("li", { children: "Violate any laws or regulations" }),
        /* @__PURE__ */ jsx("li", { children: "Infringe on intellectual property rights" }),
        /* @__PURE__ */ jsx("li", { children: "Harass, abuse, or harm others" }),
        /* @__PURE__ */ jsx("li", { children: "Distribute malware or harmful code" }),
        /* @__PURE__ */ jsx("li", { children: "Attempt to gain unauthorized access to our systems" }),
        /* @__PURE__ */ jsx("li", { children: "Use the App for any illegal or unauthorized purpose" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "5. Intellectual Property" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginBottom: "1rem" }, children: "The App and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws." }),
      /* @__PURE__ */ jsxs("p", { style: { lineHeight: "1.6" }, children: [
        /* @__PURE__ */ jsx("strong", { children: "Content Ownership:" }),
        " You retain all rights to the stories and content submitted through the App. By using the App, you grant us a limited license to store, display, and process this content solely for the purpose of providing the service."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "6. Fees and Payment" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "[UPDATE THIS SECTION based on your pricing model]" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsx("li", { children: "Current pricing is available on the Shopify App Store listing" }),
        /* @__PURE__ */ jsx("li", { children: "Fees are billed through your Shopify account" }),
        /* @__PURE__ */ jsx("li", { children: "All fees are non-refundable unless required by law" }),
        /* @__PURE__ */ jsx("li", { children: "We may change fees with 30 days notice" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "7. Data and Privacy" }),
      /* @__PURE__ */ jsxs("p", { style: { lineHeight: "1.6" }, children: [
        "Your use of the App is also governed by our",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/privacy-policy", style: { color: "#3b82f6" }, children: "Privacy Policy" }),
        ". We collect and process data as described in that policy."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "8. Disclaimers and Limitations of Liability" }),
      /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.2rem", marginBottom: "0.5rem" }, children: "8.1 No Warranties" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginBottom: "1rem" }, children: 'THE APP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.' }),
      /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.2rem", marginBottom: "0.5rem" }, children: "8.2 Limitation of Liability" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY." })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "9. Termination" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginBottom: "1rem" }, children: "We may terminate or suspend your access to the App immediately, without prior notice, for any reason, including breach of these Terms." }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "You may terminate your use of the App at any time by uninstalling it from your Shopify store. Upon termination, your data will be retained for 30 days before permanent deletion." })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "10. Changes to Terms" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: 'We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last Updated" date. Continued use of the App after changes constitutes acceptance of the updated Terms.' })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "11. Governing Law" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "These Terms shall be governed by and construed in accordance with the laws of [YOUR JURISDICTION], without regard to its conflict of law provisions." })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "12. Dispute Resolution" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "Any disputes arising from these Terms will be resolved through binding arbitration in accordance with the rules of [ARBITRATION ORGANIZATION], except where prohibited by law." })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "13. Contact Information" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "For questions about these Terms of Service, please contact us:" }),
      /* @__PURE__ */ jsxs("div", { style: { background: "#f9fafb", padding: "1rem", borderRadius: "8px", marginTop: "1rem" }, children: [
        /* @__PURE__ */ jsxs("p", { style: { margin: "0.5rem 0" }, children: [
          /* @__PURE__ */ jsx("strong", { children: "Email:" }),
          " support@yourdomain.com"
        ] }),
        /* @__PURE__ */ jsxs("p", { style: { margin: "0.5rem 0" }, children: [
          /* @__PURE__ */ jsx("strong", { children: "Website:" }),
          " https://yourdomain.com"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "14. Shopify Terms" }),
      /* @__PURE__ */ jsxs("p", { style: { lineHeight: "1.6" }, children: [
        "Your use of Shopify and this App is also subject to",
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://www.shopify.com/legal/terms", style: { color: "#3b82f6" }, children: "Shopify's Terms of Service" }),
        "."
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { marginTop: "3rem", padding: "1.5rem", background: "#fef3c7", borderRadius: "8px" }, children: /* @__PURE__ */ jsxs("p", { style: { margin: 0, fontSize: "0.9rem", color: "#92400e" }, children: [
      /* @__PURE__ */ jsx("strong", { children: "Important:" }),
      " This is a template. Please have these terms reviewed by legal counsel before publishing. Update all bracketed sections with your specific information."
    ] }) })
  ] });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: TermsOfService
}, Symbol.toStringTag, { value: "Module" }));
function PrivacyPolicy() {
  return /* @__PURE__ */ jsxs("div", { style: { maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }, children: [
    /* @__PURE__ */ jsx("h1", { style: { fontSize: "2rem", marginBottom: "1rem" }, children: "Privacy Policy" }),
    /* @__PURE__ */ jsxs("p", { style: { color: "#666", marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("strong", { children: "Last Updated:" }),
      " ",
      (/* @__PURE__ */ new Date()).toLocaleDateString()
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "1. Introduction" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: 'This Privacy Policy describes how Story App ("we", "our", or "us") collects, uses, and shares information when you use our Shopify application. We are committed to protecting your privacy and ensuring transparency in our data practices.' })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "2. Information We Collect" }),
      /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.2rem", marginBottom: "0.5rem" }, children: "2.1 Information You Provide" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginBottom: "1rem" }, children: "When you submit a story through our app, we collect:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsx("li", { children: "Submitter name and email address" }),
        /* @__PURE__ */ jsx("li", { children: "Victim name (optional)" }),
        /* @__PURE__ */ jsx("li", { children: "Relationship to victim (optional)" }),
        /* @__PURE__ */ jsx("li", { children: "Incident details (date, location, type)" }),
        /* @__PURE__ */ jsx("li", { children: "Story content and description" }),
        /* @__PURE__ */ jsx("li", { children: "Photos uploaded with the story" }),
        /* @__PURE__ */ jsx("li", { children: "Demographic information (age, gender - optional)" })
      ] }),
      /* @__PURE__ */ jsx("h3", { style: { fontSize: "1.2rem", marginBottom: "0.5rem", marginTop: "1rem" }, children: "2.2 Shopify Store Information" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "When you install our app on your Shopify store, we collect:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsx("li", { children: "Store domain and shop information" }),
        /* @__PURE__ */ jsx("li", { children: "OAuth access tokens (encrypted and stored securely)" }),
        /* @__PURE__ */ jsx("li", { children: "Store owner email" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "3. How We Use Your Information" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginBottom: "0.5rem" }, children: "We use the collected information to:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsx("li", { children: "Display submitted stories on your memorial wall" }),
        /* @__PURE__ */ jsx("li", { children: "Allow store administrators to review and manage submissions" }),
        /* @__PURE__ */ jsx("li", { children: "Sync approved stories with your Shopify store" }),
        /* @__PURE__ */ jsx("li", { children: "Provide customer support" }),
        /* @__PURE__ */ jsx("li", { children: "Improve our app functionality" }),
        /* @__PURE__ */ jsx("li", { children: "Ensure compliance with Shopify's terms of service" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "4. Data Storage and Security" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "We store your data securely using industry-standard encryption and security practices:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsx("li", { children: "All data is stored in encrypted databases" }),
        /* @__PURE__ */ jsx("li", { children: "Access tokens are encrypted at rest" }),
        /* @__PURE__ */ jsx("li", { children: "Data is transmitted over HTTPS" }),
        /* @__PURE__ */ jsx("li", { children: "We perform regular security audits" }),
        /* @__PURE__ */ jsx("li", { children: "Access to data is restricted to authorized personnel only" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "5. Data Sharing and Disclosure" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginBottom: "0.5rem" }, children: "We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "With Shopify:" }),
          " As required for app functionality"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Legal Requirements:" }),
          " When required by law or legal process"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Business Transfers:" }),
          " In connection with a merger, acquisition, or sale of assets"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "With Your Consent:" }),
          " When you explicitly authorize us to share information"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "6. Your Rights (GDPR Compliance)" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginBottom: "0.5rem" }, children: "Under the General Data Protection Regulation (GDPR) and other privacy laws, you have the right to:" }),
      /* @__PURE__ */ jsxs("ul", { style: { lineHeight: "1.8", marginLeft: "20px" }, children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Access:" }),
          " Request a copy of your personal data"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Rectification:" }),
          " Request correction of inaccurate data"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Erasure:" }),
          ' Request deletion of your data ("right to be forgotten")'
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Data Portability:" }),
          " Request your data in a machine-readable format"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Object:" }),
          " Object to processing of your data"
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Withdraw Consent:" }),
          " Withdraw consent at any time"
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6", marginTop: "1rem" }, children: "To exercise these rights, please contact us at the email address below." })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "7. Data Retention" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "We retain your data for as long as your Shopify store uses our app, or as needed to provide our services. After app uninstallation, we retain data for 30 days before permanent deletion, unless legal requirements mandate longer retention." })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "8. Cookies and Tracking" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "Our app uses session cookies necessary for authentication and app functionality. We do not use tracking cookies or third-party analytics services that collect personal information." })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "9. Children's Privacy" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately." })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "10. Changes to This Policy" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. Continued use of the app after changes constitutes acceptance of the updated policy.' })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "11. Contact Us" }),
      /* @__PURE__ */ jsx("p", { style: { lineHeight: "1.6" }, children: "If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:" }),
      /* @__PURE__ */ jsxs("div", { style: { background: "#f9fafb", padding: "1rem", borderRadius: "8px", marginTop: "1rem" }, children: [
        /* @__PURE__ */ jsxs("p", { style: { margin: "0.5rem 0" }, children: [
          /* @__PURE__ */ jsx("strong", { children: "Email:" }),
          " privacy@yourdomain.com"
        ] }),
        /* @__PURE__ */ jsxs("p", { style: { margin: "0.5rem 0" }, children: [
          /* @__PURE__ */ jsx("strong", { children: "Website:" }),
          " https://yourdomain.com"
        ] }),
        /* @__PURE__ */ jsxs("p", { style: { margin: "0.5rem 0" }, children: [
          /* @__PURE__ */ jsx("strong", { children: "Response Time:" }),
          " We will respond within 30 days"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.5rem", marginBottom: "1rem" }, children: "12. Shopify-Specific Information" }),
      /* @__PURE__ */ jsxs("p", { style: { lineHeight: "1.6" }, children: [
        "This app complies with Shopify's privacy requirements. For information about how Shopify handles your data, please review",
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://www.shopify.com/legal/privacy", style: { color: "#3b82f6" }, children: "Shopify's Privacy Policy" }),
        "."
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { marginTop: "3rem", padding: "1.5rem", background: "#eff6ff", borderRadius: "8px" }, children: /* @__PURE__ */ jsxs("p", { style: { margin: 0, fontSize: "0.9rem", color: "#1e40af" }, children: [
      /* @__PURE__ */ jsx("strong", { children: "Note:" }),
      " This privacy policy is compliant with GDPR, CCPA, and Shopify's requirements. We recommend having this reviewed by legal counsel before publishing."
    ] }) })
  ] });
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: PrivacyPolicy
}, Symbol.toStringTag, { value: "Module" }));
const pageContainer$1 = "_pageContainer_155uk_9";
const pageHeader$1 = "_pageHeader_155uk_31";
const mainTitle = "_mainTitle_155uk_43";
const subtitle = "_subtitle_155uk_61";
const contentWrapper = "_contentWrapper_155uk_79";
const filterToggleButton = "_filterToggleButton_155uk_95";
const filterDropdown = "_filterDropdown_155uk_151";
const filterContainer = "_filterContainer_155uk_221";
const filterGroup = "_filterGroup_155uk_229";
const filterButton = "_filterButton_155uk_251";
const filterButtonExpanded = "_filterButtonExpanded_155uk_309";
const filterOptions = "_filterOptions_155uk_317";
const filterOptionsExpanded = "_filterOptionsExpanded_155uk_329";
const filterOption = "_filterOption_155uk_317";
const clearFiltersButton = "_clearFiltersButton_155uk_385";
const filterOverlay = "_filterOverlay_155uk_425";
const memorialsSection = "_memorialsSection_155uk_469";
const memorialsGrid = "_memorialsGrid_155uk_479";
const memorialCard = "_memorialCard_155uk_495";
const silhouetteContainer = "_silhouetteContainer_155uk_533";
const memorialInfo = "_memorialInfo_155uk_609";
const memorialDetails = "_memorialDetails_155uk_675";
const emptyState = "_emptyState_155uk_699";
const loadMoreContainer = "_loadMoreContainer_155uk_729";
const loadMoreButton = "_loadMoreButton_155uk_745";
const successOverlay = "_successOverlay_155uk_797";
const successCard = "_successCard_155uk_815";
const successIcon = "_successIcon_155uk_835";
const successTitle = "_successTitle_155uk_869";
const successMessage = "_successMessage_155uk_883";
const successButton = "_successButton_155uk_897";
const formSectionWrapper = "_formSectionWrapper_155uk_939";
const formSectionHeader = "_formSectionHeader_155uk_951";
const formSectionTitle = "_formSectionTitle_155uk_963";
const formSectionSubtitle = "_formSectionSubtitle_155uk_979";
const styles$3 = {
  pageContainer: pageContainer$1,
  pageHeader: pageHeader$1,
  mainTitle,
  subtitle,
  contentWrapper,
  filterToggleButton,
  filterDropdown,
  filterContainer,
  filterGroup,
  filterButton,
  filterButtonExpanded,
  filterOptions,
  filterOptionsExpanded,
  filterOption,
  clearFiltersButton,
  filterOverlay,
  memorialsSection,
  memorialsGrid,
  memorialCard,
  silhouetteContainer,
  memorialInfo,
  memorialDetails,
  emptyState,
  loadMoreContainer,
  loadMoreButton,
  successOverlay,
  successCard,
  successIcon,
  successTitle,
  successMessage,
  successButton,
  formSectionWrapper,
  formSectionHeader,
  formSectionTitle,
  formSectionSubtitle
};
const loader$9 = async () => {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        status: "published"
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    const stories = submissions.map((sub) => ({
      id: sub.id,
      title: sub.shortTitle,
      victimName: sub.victimName,
      category: sub.roadUserType,
      state: sub.state,
      date: sub.incidentDate,
      status: sub.status,
      age: sub.age,
      gender: sub.gender,
      injuryType: sub.injuryType,
      year: new Date(sub.incidentDate).getFullYear().toString(),
      images: sub.photoUrls ? JSON.parse(sub.photoUrls) : [],
      description: sub.victimStory,
      relation: sub.relation,
      submitterName: sub.submitterName
    }));
    return { stories: stories.length > 0 ? stories : [] };
  } catch (error) {
    console.error("Error fetching stories:", error);
    return { stories: [] };
  }
};
async function action$2({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const formData = await request.formData();
    const submitterName2 = formData.get("submitterName");
    const submitterEmail2 = formData.get("submitterEmail");
    if (submitterEmail2) {
      const rateLimitResponse = rateLimitSubmission(request, submitterEmail2);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }
    const victimName2 = formData.get("victimName");
    const relation2 = formData.get("relation");
    const incidentDate = formData.get("incidentDate");
    const state = formData.get("state");
    const roadUserType = formData.get("roadUserType");
    const injuryType = formData.get("injuryType");
    const age = formData.get("age");
    const gender = formData.get("gender");
    const shortTitle = formData.get("shortTitle");
    const victimStory = formData.get("victimStory");
    const errors = {};
    if (!submitterName2) errors.submitterName = "Submitter name is required";
    if (!submitterEmail2) errors.submitterEmail = "Submitter email is required";
    if (!incidentDate) errors.incidentDate = "Incident date is required";
    if (!state) errors.state = "State is required";
    if (!roadUserType) errors.roadUserType = "Road user type is required";
    if (!injuryType) errors.injuryType = "Injury type is required";
    if (!shortTitle) errors.shortTitle = "Short title is required";
    if (!victimStory) errors.victimStory = "Victim's story is required";
    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 });
    }
    const parsedAge = age && age.trim() !== "" ? parseInt(age, 10) : null;
    const photoUrlsRaw = formData.get("photoUrls");
    let photoUrlsArray = [];
    try {
      if (photoUrlsRaw) {
        photoUrlsArray = JSON.parse(photoUrlsRaw);
      }
    } catch (error) {
      console.error("Error parsing photo URLs:", error);
      photoUrlsArray = [];
    }
    try {
      const submission = await prisma.submission.create({
        data: {
          shop: "public",
          submitterName: submitterName2.trim(),
          submitterEmail: submitterEmail2.trim(),
          victimName: victimName2 && victimName2.trim() !== "" ? victimName2.trim() : null,
          relation: relation2 && relation2.trim() !== "" ? relation2.trim() : null,
          incidentDate: incidentDate.trim(),
          state: state.trim(),
          roadUserType: roadUserType.trim(),
          injuryType: injuryType.trim(),
          age: parsedAge && !isNaN(parsedAge) ? parsedAge : null,
          gender: gender && gender.trim() !== "" ? gender.trim() : null,
          shortTitle: shortTitle.trim(),
          victimStory: victimStory.trim(),
          photoUrls: JSON.stringify(photoUrlsArray),
          status: "pending"
          // Pending admin review
        }
      });
      console.log("✅ Story saved to database:", submission.id);
      return json(
        {
          success: true,
          message: "Your submission has been received. Thank you for sharing this story.",
          submissionId: submission.id
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("❌ Database error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      return json(
        {
          error: `Submission error: ${error.message}. Please try again or contact support.`
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Form submission error:", error);
    console.error("Error stack:", error.stack);
    return json(
      {
        error: `Submission error: ${error.message}`
      },
      { status: 500 }
    );
  }
}
const meta$2 = () => [
  { title: "Lives Stolen | Fatal Collisions" },
  {
    name: "description",
    content: "Remembering lives lost in traffic collisions"
  }
];
function MemorialCard({ story }) {
  const hasImages = story.images && story.images.length > 0;
  return /* @__PURE__ */ jsxs(Link, { to: `/stories/${story.id}`, className: styles$3.memorialCard, children: [
    /* @__PURE__ */ jsx("div", { className: styles$3.silhouetteContainer, children: hasImages ? /* @__PURE__ */ jsx(
      "img",
      {
        src: story.images[0],
        alt: story.victimName || story.title,
        style: {
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }
      }
    ) : /* @__PURE__ */ jsx(
      "img",
      {
        src: "/Avatar-default.png",
        alt: "Default avatar",
        style: {
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: styles$3.memorialInfo, children: [
      /* @__PURE__ */ jsxs("div", { className: styles$3.memorialDetails, children: [
        "Name: ",
        story.victimName || story.title
      ] }),
      /* @__PURE__ */ jsxs("div", { className: styles$3.memorialDetails, children: [
        "Age: ",
        story.age || "N/A"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: styles$3.memorialDetails, children: [
        "Gender: ",
        story.gender || "N/A"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: styles$3.memorialDetails, children: [
        "Type: ",
        story.category
      ] })
    ] })
  ] });
}
function FilterPanel({ filters, onFilterChange, onClearFilters }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const roadUserTypes = ["Cyclist", "Pedestrian", "Motorcyclist"];
  const ageRanges = ["0-17", "18-30", "31-45", "46-60", "60+"];
  const genders = ["Male", "Female", "Other"];
  const injuryTypes = ["Fatal"];
  const states = ["California", "New York", "Texas", "Washington", "Florida", "Colorado"];
  const years = ["2024", "2023", "2022", "2021"];
  const hasActiveFilters = filters.roadUserType || filters.ageRange || filters.gender || filters.injuryType || filters.state || filters.year;
  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };
  return /* @__PURE__ */ jsxs("div", { className: styles$3.filterContainer, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        className: styles$3.filterToggleButton,
        onClick: () => setIsDropdownOpen(!isDropdownOpen),
        children: [
          /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M3 6h18M7 12h10M10 18h4" }) }),
          "Filter"
        ]
      }
    ),
    isDropdownOpen && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: styles$3.filterDropdown, children: [
        /* @__PURE__ */ jsxs("div", { className: styles$3.filterGroup, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `${styles$3.filterButton} ${expandedGroups.roadUserType ? styles$3.filterButtonExpanded : ""}`,
              onClick: () => toggleGroup("roadUserType"),
              children: [
                /* @__PURE__ */ jsx("span", { children: "Road-user type" }),
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M6 9l6 6 6-6" }) })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: `${styles$3.filterOptions} ${expandedGroups.roadUserType ? styles$3.filterOptionsExpanded : ""}`, children: roadUserTypes.map((type) => /* @__PURE__ */ jsxs("label", { className: styles$3.filterOption, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: filters.roadUserType === type,
                onChange: (e) => onFilterChange("roadUserType", e.target.checked ? type : null)
              }
            ),
            /* @__PURE__ */ jsx("span", { children: type })
          ] }, type)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: styles$3.filterGroup, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `${styles$3.filterButton} ${expandedGroups.ageRange ? styles$3.filterButtonExpanded : ""}`,
              onClick: () => toggleGroup("ageRange"),
              children: [
                /* @__PURE__ */ jsx("span", { children: "Age range" }),
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M6 9l6 6 6-6" }) })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: `${styles$3.filterOptions} ${expandedGroups.ageRange ? styles$3.filterOptionsExpanded : ""}`, children: ageRanges.map((range) => /* @__PURE__ */ jsxs("label", { className: styles$3.filterOption, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: filters.ageRange === range,
                onChange: (e) => onFilterChange("ageRange", e.target.checked ? range : null)
              }
            ),
            /* @__PURE__ */ jsx("span", { children: range })
          ] }, range)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: styles$3.filterGroup, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `${styles$3.filterButton} ${expandedGroups.gender ? styles$3.filterButtonExpanded : ""}`,
              onClick: () => toggleGroup("gender"),
              children: [
                /* @__PURE__ */ jsx("span", { children: "Gender" }),
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M6 9l6 6 6-6" }) })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: `${styles$3.filterOptions} ${expandedGroups.gender ? styles$3.filterOptionsExpanded : ""}`, children: genders.map((gender) => /* @__PURE__ */ jsxs("label", { className: styles$3.filterOption, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: filters.gender === gender,
                onChange: (e) => onFilterChange("gender", e.target.checked ? gender : null)
              }
            ),
            /* @__PURE__ */ jsx("span", { children: gender })
          ] }, gender)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: styles$3.filterGroup, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `${styles$3.filterButton} ${expandedGroups.injuryType ? styles$3.filterButtonExpanded : ""}`,
              onClick: () => toggleGroup("injuryType"),
              children: [
                /* @__PURE__ */ jsx("span", { children: "Injury type" }),
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M6 9l6 6 6-6" }) })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: `${styles$3.filterOptions} ${expandedGroups.injuryType ? styles$3.filterOptionsExpanded : ""}`, children: injuryTypes.map((type) => /* @__PURE__ */ jsxs("label", { className: styles$3.filterOption, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: filters.injuryType === type,
                onChange: (e) => onFilterChange("injuryType", e.target.checked ? type : null)
              }
            ),
            /* @__PURE__ */ jsx("span", { children: type })
          ] }, type)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: styles$3.filterGroup, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `${styles$3.filterButton} ${expandedGroups.state ? styles$3.filterButtonExpanded : ""}`,
              onClick: () => toggleGroup("state"),
              children: [
                /* @__PURE__ */ jsx("span", { children: "State" }),
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M6 9l6 6 6-6" }) })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: `${styles$3.filterOptions} ${expandedGroups.state ? styles$3.filterOptionsExpanded : ""}`, children: states.map((state) => /* @__PURE__ */ jsxs("label", { className: styles$3.filterOption, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: filters.state === state,
                onChange: (e) => onFilterChange("state", e.target.checked ? state : null)
              }
            ),
            /* @__PURE__ */ jsx("span", { children: state })
          ] }, state)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: styles$3.filterGroup, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `${styles$3.filterButton} ${expandedGroups.year ? styles$3.filterButtonExpanded : ""}`,
              onClick: () => toggleGroup("year"),
              children: [
                /* @__PURE__ */ jsx("span", { children: "Year" }),
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M6 9l6 6 6-6" }) })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: `${styles$3.filterOptions} ${expandedGroups.year ? styles$3.filterOptionsExpanded : ""}`, children: years.map((year) => /* @__PURE__ */ jsxs("label", { className: styles$3.filterOption, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: filters.year === year,
                onChange: (e) => onFilterChange("year", e.target.checked ? year : null)
              }
            ),
            /* @__PURE__ */ jsx("span", { children: year })
          ] }, year)) })
        ] }),
        hasActiveFilters && /* @__PURE__ */ jsx("button", { className: styles$3.clearFiltersButton, onClick: onClearFilters, children: "Clear all filters" })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: styles$3.filterOverlay,
          onClick: () => setIsDropdownOpen(false),
          style: { display: "block", position: "fixed", inset: 0, zIndex: 50 }
        }
      )
    ] })
  ] });
}
function StoriesPage() {
  const { stories } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [filters, setFilters] = useState({
    roadUserType: null,
    ageRange: null,
    gender: null,
    injuryType: null,
    // Changed from "Fatal" to null to show all stories
    state: null,
    year: null
  });
  const [displayCount, setDisplayCount] = useState(12);
  const ITEMS_PER_PAGE = 12;
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      if (filters.roadUserType && story.category !== filters.roadUserType) {
        return false;
      }
      if (filters.ageRange) {
        const [min, max] = filters.ageRange.includes("+") ? [parseInt(filters.ageRange), Infinity] : filters.ageRange.split("-").map(Number);
        if (story.age < min || story.age > max) {
          return false;
        }
      }
      if (filters.gender && story.gender !== filters.gender) {
        return false;
      }
      if (filters.injuryType && story.injuryType !== filters.injuryType) {
        return false;
      }
      if (filters.state && story.state !== filters.state) {
        return false;
      }
      if (filters.year && story.year !== filters.year) {
        return false;
      }
      return true;
    });
  }, [stories, filters]);
  const displayedStories = filteredStories.slice(0, displayCount);
  const hasMoreStories = displayCount < filteredStories.length;
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value
    }));
    setDisplayCount(ITEMS_PER_PAGE);
  };
  const handleClearFilters = () => {
    setFilters({
      roadUserType: null,
      ageRange: null,
      gender: null,
      injuryType: null,
      state: null,
      year: null
    });
    setDisplayCount(ITEMS_PER_PAGE);
  };
  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  };
  if (actionData == null ? void 0 : actionData.success) {
    return /* @__PURE__ */ jsx("div", { className: styles$3.pageContainer, children: /* @__PURE__ */ jsx("div", { className: styles$3.successOverlay, children: /* @__PURE__ */ jsxs("div", { className: styles$3.successCard, children: [
      /* @__PURE__ */ jsx("div", { className: styles$3.successIcon, children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ jsx("path", { d: "M20 6L9 17l-5-5" }) }) }),
      /* @__PURE__ */ jsx("h2", { className: styles$3.successTitle, children: "Thank You!" }),
      /* @__PURE__ */ jsx("p", { className: styles$3.successMessage, children: (actionData == null ? void 0 : actionData.message) || "Your submission has been received. We appreciate you sharing this story." }),
      /* @__PURE__ */ jsx(Link, { to: "/stories", className: styles$3.successButton, children: "Return to Memorial Wall" })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: styles$3.pageContainer, children: [
    /* @__PURE__ */ jsx("header", { className: styles$3.pageHeader, children: /* @__PURE__ */ jsx("h2", { className: styles$3.mainTitle, children: "Lives Stolen" }) }),
    /* @__PURE__ */ jsxs("div", { className: styles$3.contentWrapper, children: [
      /* @__PURE__ */ jsx("p", { className: styles$3.subtitle, children: "Fatal Collisions" }),
      /* @__PURE__ */ jsx(
        FilterPanel,
        {
          filters,
          onFilterChange: handleFilterChange,
          onClearFilters: handleClearFilters
        }
      ),
      /* @__PURE__ */ jsx("div", { className: styles$3.memorialsSection, children: filteredStories.length === 0 ? /* @__PURE__ */ jsx("div", { className: styles$3.emptyState, children: /* @__PURE__ */ jsx("p", { children: "No memorials found matching your filters." }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: styles$3.memorialsGrid, children: displayedStories.map((story) => /* @__PURE__ */ jsx(MemorialCard, { story }, story.id)) }),
        hasMoreStories && /* @__PURE__ */ jsx("div", { className: styles$3.loadMoreContainer, children: /* @__PURE__ */ jsx("button", { className: styles$3.loadMoreButton, onClick: handleLoadMore, children: "Load More" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: styles$3.formSectionWrapper, id: "submit-story", children: [
      /* @__PURE__ */ jsxs("div", { className: styles$3.formSectionHeader, children: [
        /* @__PURE__ */ jsx("h2", { className: styles$3.formSectionTitle, children: "Lost someone you love to traffic violence?" }),
        /* @__PURE__ */ jsx("p", { className: styles$3.formSectionSubtitle, children: "Honor their memory. Share their story." })
      ] }),
      /* @__PURE__ */ jsx(
        StorySubmissionForm,
        {
          isSubmitting,
          actionData
        }
      )
    ] })
  ] });
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: StoriesPage,
  loader: loader$9,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
const pageWrapper = "_pageWrapper_179yr_21";
const container$1 = "_container_179yr_41";
const pageHeader = "_pageHeader_179yr_59";
const backButton = "_backButton_179yr_77";
const victimName = "_victimName_179yr_111";
const mainContent = "_mainContent_179yr_133";
const imageSection = "_imageSection_179yr_153";
const imageGalleryWrapper = "_imageGalleryWrapper_179yr_165";
const profileImage = "_profileImage_179yr_177";
const mainImage = "_mainImage_179yr_199";
const placeholderImage = "_placeholderImage_179yr_213";
const thumbnails = "_thumbnails_179yr_233";
const thumbnail = "_thumbnail_179yr_233";
const activeThumbnail = "_activeThumbnail_179yr_293";
const infoSection = "_infoSection_179yr_309";
const relation = "_relation_179yr_323";
const location$1 = "_location_179yr_339";
const date$1 = "_date_179yr_367";
const category$1 = "_category_179yr_383";
const shareButtons = "_shareButtons_179yr_403";
const shareButton = "_shareButton_179yr_403";
const storyContent = "_storyContent_179yr_473";
const storyLabel = "_storyLabel_179yr_481";
const storyText = "_storyText_179yr_495";
const additionalDetails = "_additionalDetails_179yr_531";
const detailItem = "_detailItem_179yr_551";
const detailLabel = "_detailLabel_179yr_563";
const detailValue = "_detailValue_179yr_579";
const submitterInfo = "_submitterInfo_179yr_597";
const styles$2 = {
  pageWrapper,
  container: container$1,
  pageHeader,
  backButton,
  victimName,
  mainContent,
  imageSection,
  imageGalleryWrapper,
  profileImage,
  mainImage,
  placeholderImage,
  thumbnails,
  thumbnail,
  activeThumbnail,
  infoSection,
  relation,
  location: location$1,
  date: date$1,
  category: category$1,
  shareButtons,
  shareButton,
  storyContent,
  storyLabel,
  storyText,
  additionalDetails,
  detailItem,
  detailLabel,
  detailValue,
  submitterInfo
};
const loader$8 = async ({ params }) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id }
    });
    if (!submission) {
      throw new Response("Story not found", { status: 404 });
    }
    const story = {
      id: submission.id,
      title: submission.shortTitle,
      victimName: submission.victimName,
      category: submission.roadUserType,
      state: submission.state,
      date: submission.incidentDate,
      status: submission.status,
      age: submission.age,
      gender: submission.gender,
      injuryType: submission.injuryType,
      year: new Date(submission.incidentDate).getFullYear().toString(),
      images: submission.photoUrls ? JSON.parse(submission.photoUrls) : [],
      description: submission.victimStory,
      relation: submission.relation,
      submitterName: submission.submitterName
    };
    return json({ story });
  } catch (error) {
    console.error("Error fetching story:", error);
    throw new Response("Story not found", { status: 404 });
  }
};
const meta$1 = ({ data }) => [
  { title: `${data.story.victimName || data.story.title} | Story Submission` },
  {
    name: "description",
    content: data.story.description.substring(0, 160) + "..."
  }
];
function ShareButtons({ story }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Read ${story.victimName}'s story`;
  const handleShare = (platform) => {
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    };
    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: styles$2.shareButtons, children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => handleShare("facebook"),
        className: styles$2.shareButton,
        "aria-label": "Share on Facebook",
        children: /* @__PURE__ */ jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => handleShare("linkedin"),
        className: styles$2.shareButton,
        "aria-label": "Share on LinkedIn",
        children: /* @__PURE__ */ jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" }) })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleCopy,
        className: styles$2.shareButton,
        "aria-label": "Copy link",
        children: /* @__PURE__ */ jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
          /* @__PURE__ */ jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
          /* @__PURE__ */ jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
        ] })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => handleShare("twitter"),
        className: styles$2.shareButton,
        "aria-label": "Share",
        children: /* @__PURE__ */ jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
          /* @__PURE__ */ jsx("circle", { cx: "18", cy: "5", r: "3" }),
          /* @__PURE__ */ jsx("circle", { cx: "6", cy: "12", r: "3" }),
          /* @__PURE__ */ jsx("circle", { cx: "18", cy: "19", r: "3" }),
          /* @__PURE__ */ jsx("line", { x1: "8.59", y1: "13.51", x2: "15.42", y2: "17.49" }),
          /* @__PURE__ */ jsx("line", { x1: "15.41", y1: "6.51", x2: "8.59", y2: "10.49" })
        ] })
      }
    )
  ] });
}
function ImageGallery({ images, victimName: victimName2 }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  if (!images || images.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: styles$2.profileImage, children: /* @__PURE__ */ jsx("div", { className: styles$2.placeholderImage, children: /* @__PURE__ */ jsx(
      "img",
      {
        src: "/Avatar-default.png",
        alt: "Default avatar",
        style: {
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }
      }
    ) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: styles$2.imageGalleryWrapper, children: [
    /* @__PURE__ */ jsx("div", { className: styles$2.profileImage, children: /* @__PURE__ */ jsx(
      "img",
      {
        src: images[selectedImageIndex],
        alt: victimName2 || "Memorial photo",
        className: styles$2.mainImage
      }
    ) }),
    images.length > 1 && /* @__PURE__ */ jsx("div", { className: styles$2.thumbnails, children: images.map((image, index) => /* @__PURE__ */ jsx(
      "button",
      {
        className: `${styles$2.thumbnail} ${index === selectedImageIndex ? styles$2.activeThumbnail : ""}`,
        onClick: () => setSelectedImageIndex(index),
        "aria-label": `View image ${index + 1}`,
        children: /* @__PURE__ */ jsx("img", { src: image, alt: `Thumbnail ${index + 1}` })
      },
      index
    )) })
  ] });
}
function StoryDetail() {
  const { story } = useLoaderData();
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });
  };
  return /* @__PURE__ */ jsx("div", { className: styles$2.pageWrapper, children: /* @__PURE__ */ jsxs("div", { className: styles$2.container, children: [
    /* @__PURE__ */ jsxs("header", { className: styles$2.pageHeader, children: [
      /* @__PURE__ */ jsx(Link, { to: "/stories", className: styles$2.backButton, "aria-label": "Back to stories", children: /* @__PURE__ */ jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M19 12H5M12 19l-7-7 7-7" }) }) }),
      /* @__PURE__ */ jsx("h1", { className: styles$2.victimName, children: story.victimName || story.title })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: styles$2.mainContent, children: [
      /* @__PURE__ */ jsx("div", { className: styles$2.imageSection, children: /* @__PURE__ */ jsx(ImageGallery, { images: story.images, victimName: story.victimName }) }),
      /* @__PURE__ */ jsxs("div", { className: styles$2.infoSection, children: [
        story.relation && /* @__PURE__ */ jsx("p", { className: styles$2.relation, children: story.relation }),
        story.state && /* @__PURE__ */ jsxs("p", { className: styles$2.location, children: [
          /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ jsx("path", { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" }),
            /* @__PURE__ */ jsx("circle", { cx: "12", cy: "10", r: "3" })
          ] }),
          story.state
        ] }),
        story.date && /* @__PURE__ */ jsxs("p", { className: styles$2.date, children: [
          "Killed ",
          formatDate(story.date)
        ] }),
        story.category && /* @__PURE__ */ jsx("p", { className: styles$2.category, children: story.category }),
        /* @__PURE__ */ jsx(ShareButtons, { story })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("article", { className: styles$2.storyContent, children: [
      /* @__PURE__ */ jsx("h2", { className: styles$2.storyLabel, children: "Story:" }),
      /* @__PURE__ */ jsx("div", { className: styles$2.storyText, children: story.description.split("\n").map((paragraph, index) => paragraph.trim() && /* @__PURE__ */ jsx("p", { children: paragraph }, index)) }),
      (story.age || story.gender || story.injuryType) && /* @__PURE__ */ jsxs("div", { className: styles$2.additionalDetails, children: [
        story.age && /* @__PURE__ */ jsxs("div", { className: styles$2.detailItem, children: [
          /* @__PURE__ */ jsx("span", { className: styles$2.detailLabel, children: "Age:" }),
          /* @__PURE__ */ jsx("span", { className: styles$2.detailValue, children: story.age })
        ] }),
        story.gender && /* @__PURE__ */ jsxs("div", { className: styles$2.detailItem, children: [
          /* @__PURE__ */ jsx("span", { className: styles$2.detailLabel, children: "Gender:" }),
          /* @__PURE__ */ jsx("span", { className: styles$2.detailValue, children: story.gender })
        ] }),
        story.injuryType && /* @__PURE__ */ jsxs("div", { className: styles$2.detailItem, children: [
          /* @__PURE__ */ jsx("span", { className: styles$2.detailLabel, children: "Injury Type:" }),
          /* @__PURE__ */ jsx("span", { className: styles$2.detailValue, children: story.injuryType })
        ] })
      ] }),
      story.submitterName && /* @__PURE__ */ jsx("div", { className: styles$2.submitterInfo, children: /* @__PURE__ */ jsxs("em", { children: [
        "Submitted by: ",
        story.submitterName
      ] }) })
    ] })
  ] }) });
}
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: StoryDetail,
  loader: loader$8,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
const Polaris = /* @__PURE__ */ JSON.parse('{"ActionMenu":{"Actions":{"moreActions":"More actions"},"RollupActions":{"rollupButton":"View actions"}},"ActionList":{"SearchField":{"clearButtonLabel":"Clear","search":"Search","placeholder":"Search actions"}},"Avatar":{"label":"Avatar","labelWithInitials":"Avatar with initials {initials}"},"Autocomplete":{"spinnerAccessibilityLabel":"Loading","ellipsis":"{content}…"},"Badge":{"PROGRESS_LABELS":{"incomplete":"Incomplete","partiallyComplete":"Partially complete","complete":"Complete"},"TONE_LABELS":{"info":"Info","success":"Success","warning":"Warning","critical":"Critical","attention":"Attention","new":"New","readOnly":"Read-only","enabled":"Enabled"},"progressAndTone":"{toneLabel} {progressLabel}"},"Banner":{"dismissButton":"Dismiss notification"},"Button":{"spinnerAccessibilityLabel":"Loading"},"Common":{"checkbox":"checkbox","undo":"Undo","cancel":"Cancel","clear":"Clear","close":"Close","submit":"Submit","more":"More"},"ContextualSaveBar":{"save":"Save","discard":"Discard"},"DataTable":{"sortAccessibilityLabel":"sort {direction} by","navAccessibilityLabel":"Scroll table {direction} one column","totalsRowHeading":"Totals","totalRowHeading":"Total"},"DatePicker":{"previousMonth":"Show previous month, {previousMonthName} {showPreviousYear}","nextMonth":"Show next month, {nextMonth} {nextYear}","today":"Today ","start":"Start of range","end":"End of range","months":{"january":"January","february":"February","march":"March","april":"April","may":"May","june":"June","july":"July","august":"August","september":"September","october":"October","november":"November","december":"December"},"days":{"monday":"Monday","tuesday":"Tuesday","wednesday":"Wednesday","thursday":"Thursday","friday":"Friday","saturday":"Saturday","sunday":"Sunday"},"daysAbbreviated":{"monday":"Mo","tuesday":"Tu","wednesday":"We","thursday":"Th","friday":"Fr","saturday":"Sa","sunday":"Su"}},"DiscardConfirmationModal":{"title":"Discard all unsaved changes","message":"If you discard changes, you’ll delete any edits you made since you last saved.","primaryAction":"Discard changes","secondaryAction":"Continue editing"},"DropZone":{"single":{"overlayTextFile":"Drop file to upload","overlayTextImage":"Drop image to upload","overlayTextVideo":"Drop video to upload","actionTitleFile":"Add file","actionTitleImage":"Add image","actionTitleVideo":"Add video","actionHintFile":"or drop file to upload","actionHintImage":"or drop image to upload","actionHintVideo":"or drop video to upload","labelFile":"Upload file","labelImage":"Upload image","labelVideo":"Upload video"},"allowMultiple":{"overlayTextFile":"Drop files to upload","overlayTextImage":"Drop images to upload","overlayTextVideo":"Drop videos to upload","actionTitleFile":"Add files","actionTitleImage":"Add images","actionTitleVideo":"Add videos","actionHintFile":"or drop files to upload","actionHintImage":"or drop images to upload","actionHintVideo":"or drop videos to upload","labelFile":"Upload files","labelImage":"Upload images","labelVideo":"Upload videos"},"errorOverlayTextFile":"File type is not valid","errorOverlayTextImage":"Image type is not valid","errorOverlayTextVideo":"Video type is not valid"},"EmptySearchResult":{"altText":"Empty search results"},"Frame":{"skipToContent":"Skip to content","navigationLabel":"Navigation","Navigation":{"closeMobileNavigationLabel":"Close navigation"}},"FullscreenBar":{"back":"Back","accessibilityLabel":"Exit fullscreen mode"},"Filters":{"moreFilters":"More filters","moreFiltersWithCount":"More filters ({count})","filter":"Filter {resourceName}","noFiltersApplied":"No filters applied","cancel":"Cancel","done":"Done","clearAllFilters":"Clear all filters","clear":"Clear","clearLabel":"Clear {filterName}","addFilter":"Add filter","clearFilters":"Clear all","searchInView":"in:{viewName}"},"FilterPill":{"clear":"Clear","unsavedChanges":"Unsaved changes - {label}"},"IndexFilters":{"searchFilterTooltip":"Search and filter","searchFilterTooltipWithShortcut":"Search and filter (F)","searchFilterAccessibilityLabel":"Search and filter results","sort":"Sort your results","addView":"Add a new view","newView":"Custom search","SortButton":{"ariaLabel":"Sort the results","tooltip":"Sort","title":"Sort by","sorting":{"asc":"Ascending","desc":"Descending","az":"A-Z","za":"Z-A"}},"EditColumnsButton":{"tooltip":"Edit columns","accessibilityLabel":"Customize table column order and visibility"},"UpdateButtons":{"cancel":"Cancel","update":"Update","save":"Save","saveAs":"Save as","modal":{"title":"Save view as","label":"Name","sameName":"A view with this name already exists. Please choose a different name.","save":"Save","cancel":"Cancel"}}},"IndexProvider":{"defaultItemSingular":"Item","defaultItemPlural":"Items","allItemsSelected":"All {itemsLength}+ {resourceNamePlural} are selected","selected":"{selectedItemsCount} selected","a11yCheckboxDeselectAllSingle":"Deselect {resourceNameSingular}","a11yCheckboxSelectAllSingle":"Select {resourceNameSingular}","a11yCheckboxDeselectAllMultiple":"Deselect all {itemsLength} {resourceNamePlural}","a11yCheckboxSelectAllMultiple":"Select all {itemsLength} {resourceNamePlural}"},"IndexTable":{"emptySearchTitle":"No {resourceNamePlural} found","emptySearchDescription":"Try changing the filters or search term","onboardingBadgeText":"New","resourceLoadingAccessibilityLabel":"Loading {resourceNamePlural}…","selectAllLabel":"Select all {resourceNamePlural}","selected":"{selectedItemsCount} selected","undo":"Undo","selectAllItems":"Select all {itemsLength}+ {resourceNamePlural}","selectItem":"Select {resourceName}","selectButtonText":"Select","sortAccessibilityLabel":"sort {direction} by"},"Loading":{"label":"Page loading bar"},"Modal":{"iFrameTitle":"body markup","modalWarning":"These required properties are missing from Modal: {missingProps}"},"Page":{"Header":{"rollupActionsLabel":"View actions for {title}","pageReadyAccessibilityLabel":"{title}. This page is ready"}},"Pagination":{"previous":"Previous","next":"Next","pagination":"Pagination"},"ProgressBar":{"negativeWarningMessage":"Values passed to the progress prop shouldn’t be negative. Resetting {progress} to 0.","exceedWarningMessage":"Values passed to the progress prop shouldn’t exceed 100. Setting {progress} to 100."},"ResourceList":{"sortingLabel":"Sort by","defaultItemSingular":"item","defaultItemPlural":"items","showing":"Showing {itemsCount} {resource}","showingTotalCount":"Showing {itemsCount} of {totalItemsCount} {resource}","loading":"Loading {resource}","selected":"{selectedItemsCount} selected","allItemsSelected":"All {itemsLength}+ {resourceNamePlural} in your store are selected","allFilteredItemsSelected":"All {itemsLength}+ {resourceNamePlural} in this filter are selected","selectAllItems":"Select all {itemsLength}+ {resourceNamePlural} in your store","selectAllFilteredItems":"Select all {itemsLength}+ {resourceNamePlural} in this filter","emptySearchResultTitle":"No {resourceNamePlural} found","emptySearchResultDescription":"Try changing the filters or search term","selectButtonText":"Select","a11yCheckboxDeselectAllSingle":"Deselect {resourceNameSingular}","a11yCheckboxSelectAllSingle":"Select {resourceNameSingular}","a11yCheckboxDeselectAllMultiple":"Deselect all {itemsLength} {resourceNamePlural}","a11yCheckboxSelectAllMultiple":"Select all {itemsLength} {resourceNamePlural}","Item":{"actionsDropdownLabel":"Actions for {accessibilityLabel}","actionsDropdown":"Actions dropdown","viewItem":"View details for {itemName}"},"BulkActions":{"actionsActivatorLabel":"Actions","moreActionsActivatorLabel":"More actions"}},"SkeletonPage":{"loadingLabel":"Page loading"},"Tabs":{"newViewAccessibilityLabel":"Create new view","newViewTooltip":"Create view","toggleTabsLabel":"More views","Tab":{"rename":"Rename view","duplicate":"Duplicate view","edit":"Edit view","editColumns":"Edit columns","delete":"Delete view","copy":"Copy of {name}","deleteModal":{"title":"Delete view?","description":"This can’t be undone. {viewName} view will no longer be available in your admin.","cancel":"Cancel","delete":"Delete view"}},"RenameModal":{"title":"Rename view","label":"Name","cancel":"Cancel","create":"Save","errors":{"sameName":"A view with this name already exists. Please choose a different name."}},"DuplicateModal":{"title":"Duplicate view","label":"Name","cancel":"Cancel","create":"Create view","errors":{"sameName":"A view with this name already exists. Please choose a different name."}},"CreateViewModal":{"title":"Create new view","label":"Name","cancel":"Cancel","create":"Create view","errors":{"sameName":"A view with this name already exists. Please choose a different name."}}},"Tag":{"ariaLabel":"Remove {children}"},"TextField":{"characterCount":"{count} characters","characterCountWithMaxLength":"{count} of {limit} characters used"},"TooltipOverlay":{"accessibilityLabel":"Tooltip: {label}"},"TopBar":{"toggleMenuLabel":"Toggle menu","SearchField":{"clearButtonLabel":"Clear","search":"Search"}},"MediaCard":{"dismissButton":"Dismiss","popoverButton":"Actions"},"VideoThumbnail":{"playButtonA11yLabel":{"default":"Play video","defaultWithDuration":"Play video of length {duration}","duration":{"hours":{"other":{"only":"{hourCount} hours","andMinutes":"{hourCount} hours and {minuteCount} minutes","andMinute":"{hourCount} hours and {minuteCount} minute","minutesAndSeconds":"{hourCount} hours, {minuteCount} minutes, and {secondCount} seconds","minutesAndSecond":"{hourCount} hours, {minuteCount} minutes, and {secondCount} second","minuteAndSeconds":"{hourCount} hours, {minuteCount} minute, and {secondCount} seconds","minuteAndSecond":"{hourCount} hours, {minuteCount} minute, and {secondCount} second","andSeconds":"{hourCount} hours and {secondCount} seconds","andSecond":"{hourCount} hours and {secondCount} second"},"one":{"only":"{hourCount} hour","andMinutes":"{hourCount} hour and {minuteCount} minutes","andMinute":"{hourCount} hour and {minuteCount} minute","minutesAndSeconds":"{hourCount} hour, {minuteCount} minutes, and {secondCount} seconds","minutesAndSecond":"{hourCount} hour, {minuteCount} minutes, and {secondCount} second","minuteAndSeconds":"{hourCount} hour, {minuteCount} minute, and {secondCount} seconds","minuteAndSecond":"{hourCount} hour, {minuteCount} minute, and {secondCount} second","andSeconds":"{hourCount} hour and {secondCount} seconds","andSecond":"{hourCount} hour and {secondCount} second"}},"minutes":{"other":{"only":"{minuteCount} minutes","andSeconds":"{minuteCount} minutes and {secondCount} seconds","andSecond":"{minuteCount} minutes and {secondCount} second"},"one":{"only":"{minuteCount} minute","andSeconds":"{minuteCount} minute and {secondCount} seconds","andSecond":"{minuteCount} minute and {secondCount} second"}},"seconds":{"other":"{secondCount} seconds","one":"{secondCount} second"}}}}}');
const polarisTranslations = {
  Polaris
};
const polarisStyles = "/assets/styles-CV7GIAUv.css";
function loginErrorMessage(loginErrors) {
  if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }
  return {};
}
const links$1 = () => [{ rel: "stylesheet", href: polarisStyles }];
const loader$7 = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return { errors, polarisTranslations };
};
const action$1 = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return {
    errors
  };
};
function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;
  return /* @__PURE__ */ jsx(AppProvider, { i18n: loaderData.polarisTranslations, children: /* @__PURE__ */ jsx(Page, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(Form, { method: "post", children: /* @__PURE__ */ jsxs(FormLayout, { children: [
    /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "Log in" }),
    /* @__PURE__ */ jsx(
      TextField,
      {
        type: "text",
        name: "shop",
        label: "Shop domain",
        helpText: "example.myshopify.com",
        value: shop,
        onChange: setShop,
        autoComplete: "on",
        error: errors.shop
      }
    ),
    /* @__PURE__ */ jsx(Button, { submit: true, children: "Log in" })
  ] }) }) }) }) });
}
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: Auth,
  links: links$1,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
const loader$6 = async () => {
  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain"
    }
  });
};
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const loader$5 = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const pageContainer = "_pageContainer_1x8xq_9";
const heroSection = "_heroSection_1x8xq_31";
const heroContent = "_heroContent_1x8xq_69";
const heroTitle = "_heroTitle_1x8xq_81";
const heroSubtitle = "_heroSubtitle_1x8xq_101";
const heroDescription = "_heroDescription_1x8xq_117";
const heroButtons = "_heroButtons_1x8xq_137";
const primaryButton = "_primaryButton_1x8xq_153";
const secondaryButton = "_secondaryButton_1x8xq_197";
const featuresSection = "_featuresSection_1x8xq_243";
const featuresContent = "_featuresContent_1x8xq_253";
const featuresTitle = "_featuresTitle_1x8xq_263";
const featuresGrid = "_featuresGrid_1x8xq_283";
const featureCard = "_featureCard_1x8xq_295";
const featureIcon = "_featureIcon_1x8xq_325";
const featureTitle = "_featureTitle_1x8xq_359";
const featureDescription = "_featureDescription_1x8xq_373";
const ctaSection = "_ctaSection_1x8xq_389";
const ctaContent = "_ctaContent_1x8xq_401";
const ctaTitle = "_ctaTitle_1x8xq_411";
const ctaDescription = "_ctaDescription_1x8xq_427";
const ctaButton = "_ctaButton_1x8xq_441";
const adminSection = "_adminSection_1x8xq_487";
const form = "_form_1x8xq_501";
const label = "_label_1x8xq_517";
const input = "_input_1x8xq_535";
const button = "_button_1x8xq_567";
const styles$1 = {
  pageContainer,
  heroSection,
  heroContent,
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroButtons,
  primaryButton,
  secondaryButton,
  featuresSection,
  featuresContent,
  featuresTitle,
  featuresGrid,
  featureCard,
  featureIcon,
  featureTitle,
  featureDescription,
  ctaSection,
  ctaContent,
  ctaTitle,
  ctaDescription,
  ctaButton,
  adminSection,
  form,
  label,
  input,
  button
};
const loader$4 = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { showForm: Boolean(login) };
};
function App$1() {
  const { showForm } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: styles$1.pageContainer, children: [
    /* @__PURE__ */ jsx("section", { className: styles$1.heroSection, children: /* @__PURE__ */ jsxs("div", { className: styles$1.heroContent, children: [
      /* @__PURE__ */ jsx("h1", { className: styles$1.heroTitle, children: "Lives Stolen" }),
      /* @__PURE__ */ jsx("p", { className: styles$1.heroSubtitle, children: "Remembering those who lost their lives to traffic violence" }),
      /* @__PURE__ */ jsx("p", { className: styles$1.heroDescription, children: "Every life lost on our roads represents a family forever changed, dreams cut short, and a community diminished. This memorial honors their memory and tells their stories." }),
      /* @__PURE__ */ jsxs("div", { className: styles$1.heroButtons, children: [
        /* @__PURE__ */ jsx("a", { href: "/stories", className: styles$1.primaryButton, children: "View Memorial Wall" }),
        /* @__PURE__ */ jsx("a", { href: "/stories#submit-story", className: styles$1.secondaryButton, children: "Share a Story" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: styles$1.featuresSection, children: /* @__PURE__ */ jsxs("div", { className: styles$1.featuresContent, children: [
      /* @__PURE__ */ jsx("h2", { className: styles$1.featuresTitle, children: "Honoring Their Memory" }),
      /* @__PURE__ */ jsxs("div", { className: styles$1.featuresGrid, children: [
        /* @__PURE__ */ jsxs("div", { className: styles$1.featureCard, children: [
          /* @__PURE__ */ jsx("div", { className: styles$1.featureIcon, children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            /* @__PURE__ */ jsx("circle", { cx: "12", cy: "7", r: "4" })
          ] }) }),
          /* @__PURE__ */ jsx("h3", { className: styles$1.featureTitle, children: "Remember Lives Lost" }),
          /* @__PURE__ */ jsx("p", { className: styles$1.featureDescription, children: "Browse memorials of individuals who lost their lives in traffic collisions. Each story represents a real person with loved ones left behind." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: styles$1.featureCard, children: [
          /* @__PURE__ */ jsx("div", { className: styles$1.featureIcon, children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
            /* @__PURE__ */ jsx("polyline", { points: "14 2 14 8 20 8" })
          ] }) }),
          /* @__PURE__ */ jsx("h3", { className: styles$1.featureTitle, children: "Share Their Story" }),
          /* @__PURE__ */ jsx("p", { className: styles$1.featureDescription, children: "Help us remember by submitting stories of those lost to traffic violence. Your submission honors their memory and raises awareness." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: styles$1.featureCard, children: [
          /* @__PURE__ */ jsx("div", { className: styles$1.featureIcon, children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ jsx("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
            /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4" }),
            /* @__PURE__ */ jsx("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
            /* @__PURE__ */ jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
          ] }) }),
          /* @__PURE__ */ jsx("h3", { className: styles$1.featureTitle, children: "Build Awareness" }),
          /* @__PURE__ */ jsx("p", { className: styles$1.featureDescription, children: "Together we can raise awareness about traffic safety and advocate for safer streets for pedestrians, cyclists, and all road users." })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: styles$1.ctaSection, children: /* @__PURE__ */ jsxs("div", { className: styles$1.ctaContent, children: [
      /* @__PURE__ */ jsx("h2", { className: styles$1.ctaTitle, children: "Lost someone to traffic violence?" }),
      /* @__PURE__ */ jsx("p", { className: styles$1.ctaDescription, children: "Share their story and honor their memory on our memorial wall." }),
      /* @__PURE__ */ jsx("a", { href: "/stories#submit-story", className: styles$1.ctaButton, children: "Submit a Story" })
    ] }) }),
    showForm && /* @__PURE__ */ jsx("section", { className: styles$1.adminSection, children: /* @__PURE__ */ jsxs(Form, { className: styles$1.form, method: "post", action: "/auth/login", children: [
      /* @__PURE__ */ jsxs("label", { className: styles$1.label, children: [
        /* @__PURE__ */ jsx("span", { children: "Shop domain" }),
        /* @__PURE__ */ jsx("input", { className: styles$1.input, type: "text", name: "shop" }),
        /* @__PURE__ */ jsx("span", { children: "e.g: my-shop-domain.myshopify.com" })
      ] }),
      /* @__PURE__ */ jsx("button", { className: styles$1.button, type: "submit", children: "Admin Log in" })
    ] }) })
  ] });
}
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App$1,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{ rel: "stylesheet", href: polarisStyles }];
const loader$3 = async ({ request }) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};
function App() {
  const { apiKey } = useLoaderData();
  return /* @__PURE__ */ jsxs(AppProvider$1, { isEmbeddedApp: true, apiKey, children: [
    /* @__PURE__ */ jsxs(NavMenu, { children: [
      /* @__PURE__ */ jsx(Link, { to: "/app", rel: "home", children: "Home" }),
      /* @__PURE__ */ jsx(Link, { to: "/app/submissions", children: "Submissions" })
    ] }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
function ErrorBoundary() {
  return boundary.error(useRouteError());
}
const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: App,
  headers,
  links,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const action = async ({ request }) => {
  var _a2, _b, _c, _d, _e, _f, _g, _h;
  const { admin, session } = await authenticate.admin(request);
  try {
    const checkQuery = `
      query {
        metaobjectDefinitions(first: 50) {
          nodes {
            id
            type
            name
          }
        }
      }
    `;
    const checkResponse = await admin.graphql(checkQuery);
    const checkData = await checkResponse.json();
    const existingDef = (_c = (_b = (_a2 = checkData.data) == null ? void 0 : _a2.metaobjectDefinitions) == null ? void 0 : _b.nodes) == null ? void 0 : _c.find(
      (def) => def.type === "story"
    );
    if (existingDef) {
      return json({
        success: true,
        message: "Story metaobject definition already exists",
        definition: existingDef,
        alreadyExists: true
      });
    }
    const createDefinitionMutation = `
      mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition {
            id
            name
            type
            fieldDefinitions {
              name
              key
              type {
                name
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const variables = {
      definition: {
        name: "Story",
        type: "story",
        description: "Memorial stories submitted by the community",
        fieldDefinitions: [
          {
            name: "Submitter Name",
            key: "submitter_name",
            description: "Name of the person submitting the story",
            type: "single_line_text_field",
            required: true
          },
          {
            name: "Submitter Email",
            key: "submitter_email",
            description: "Email of the person submitting the story",
            type: "single_line_text_field",
            required: true
          },
          {
            name: "Victim Name",
            key: "victim_name",
            description: "Name of the victim",
            type: "single_line_text_field",
            required: false
          },
          {
            name: "Relation",
            key: "relation",
            description: "Relationship to the victim",
            type: "single_line_text_field",
            required: false
          },
          {
            name: "Age",
            key: "age",
            description: "Age of the victim",
            type: "number_integer",
            required: false
          },
          {
            name: "Gender",
            key: "gender",
            description: "Gender of the victim",
            type: "single_line_text_field",
            required: false
          },
          {
            name: "Incident Date",
            key: "incident_date",
            description: "Date of the incident",
            type: "date",
            required: false
          },
          {
            name: "State",
            key: "state",
            description: "State where the incident occurred",
            type: "single_line_text_field",
            required: false
          },
          {
            name: "Road User Type",
            key: "road_user_type",
            description: "Type of road user (pedestrian, cyclist, etc.)",
            type: "single_line_text_field",
            required: false
          },
          {
            name: "Injury Type",
            key: "injury_type",
            description: "Type of injury sustained",
            type: "single_line_text_field",
            required: false
          },
          {
            name: "Short Title",
            key: "short_title",
            description: "Brief title for the story",
            type: "single_line_text_field",
            required: true
          },
          {
            name: "Victim Story",
            key: "victim_story",
            description: "Full story text",
            type: "multi_line_text_field",
            required: true
          },
          {
            name: "Photo URLs",
            key: "photo_urls",
            description: "JSON array of photo URLs",
            type: "multi_line_text_field",
            required: false
          },
          {
            name: "Status",
            key: "status",
            description: "Publication status (pending, published, rejected)",
            type: "single_line_text_field",
            required: false
          },
          {
            name: "Published At",
            key: "published_at",
            description: "Date when the story was published",
            type: "date_time",
            required: false
          }
        ],
        access: {
          admin: "PUBLIC_READ_WRITE",
          storefront: "PUBLIC_READ"
        }
      }
    };
    const response = await admin.graphql(createDefinitionMutation, {
      variables
    });
    const data = await response.json();
    if (((_f = (_e = (_d = data.data) == null ? void 0 : _d.metaobjectDefinitionCreate) == null ? void 0 : _e.userErrors) == null ? void 0 : _f.length) > 0) {
      return json({
        success: false,
        errors: data.data.metaobjectDefinitionCreate.userErrors
      }, { status: 400 });
    }
    return json({
      success: true,
      message: "Story metaobject definition created successfully!",
      definition: (_h = (_g = data.data) == null ? void 0 : _g.metaobjectDefinitionCreate) == null ? void 0 : _h.metaobjectDefinition
    });
  } catch (error) {
    console.error("Error setting up metaobject definition:", error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};
const loader$2 = async ({ request }) => {
  return json({ message: "Use POST to set up metaobject definition" }, { status: 405 });
};
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const container = "_container_65039_9";
const header = "_header_65039_31";
const pageTitle = "_pageTitle_65039_43";
const pageSubtitle = "_pageSubtitle_65039_59";
const stats = "_stats_65039_77";
const statCard = "_statCard_65039_91";
const statLabel = "_statLabel_65039_107";
const statNumber = "_statNumber_65039_125";
const section = "_section_65039_141";
const sectionTitle = "_sectionTitle_65039_149";
const count = "_count_65039_169";
const emptyMessage = "_emptyMessage_65039_189";
const submissionsList = "_submissionsList_65039_209";
const submissionCard = "_submissionCard_65039_221";
const cardHeader = "_cardHeader_65039_253";
const submitterName = "_submitterName_65039_273";
const submitterEmail = "_submitterEmail_65039_287";
const statusBadge = "_statusBadge_65039_299";
const cardContent = "_cardContent_65039_321";
const category = "_category_65039_337";
const location = "_location_65039_339";
const date = "_date_65039_341";
const storyPreview = "_storyPreview_65039_369";
const previewLabel = "_previewLabel_65039_383";
const previewText = "_previewText_65039_399";
const metadata = "_metadata_65039_413";
const metaItem = "_metaItem_65039_431";
const timestamps = "_timestamps_65039_449";
const timestamp = "_timestamp_65039_449";
const viewButton = "_viewButton_65039_475";
const adminNotes = "_adminNotes_65039_513";
const notesLabel = "_notesLabel_65039_527";
const notesText = "_notesText_65039_543";
const instructions = "_instructions_65039_559";
const instructionsTitle = "_instructionsTitle_65039_575";
const instructionsList = "_instructionsList_65039_589";
const instructionsNote = "_instructionsNote_65039_611";
const styles = {
  container,
  header,
  pageTitle,
  pageSubtitle,
  stats,
  statCard,
  statLabel,
  statNumber,
  section,
  sectionTitle,
  count,
  emptyMessage,
  submissionsList,
  submissionCard,
  cardHeader,
  submitterName,
  submitterEmail,
  statusBadge,
  cardContent,
  category,
  location,
  date,
  storyPreview,
  previewLabel,
  previewText,
  metadata,
  metaItem,
  timestamps,
  timestamp,
  viewButton,
  adminNotes,
  notesLabel,
  notesText,
  instructions,
  instructionsTitle,
  instructionsList,
  instructionsNote
};
async function loader$1({ request }) {
  const { session } = await authenticate.admin(request);
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const allSubmissions = await prisma.submission.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
  const submissions = allSubmissions.map((sub) => ({
    id: sub.id,
    firstName: sub.submitterName.split(" ")[0] || "",
    lastName: sub.submitterName.split(" ").slice(1).join(" ") || "",
    email: sub.submitterEmail,
    category: sub.roadUserType,
    location: sub.state,
    date: sub.incidentDate,
    details: sub.victimStory,
    podcastContact: false,
    imageUrls: sub.photoUrls ? JSON.parse(sub.photoUrls) : [],
    createdAt: sub.createdAt,
    publishedAt: sub.publishedAt,
    status: sub.status,
    adminNotes: sub.adminNotes || "",
    blogPostUrl: null,
    metaobjectId: sub.metaobjectId
  }));
  const pending = submissions.filter((s) => s.status === "pending");
  const published = submissions.filter((s) => s.status === "published");
  const rejected = submissions.filter((s) => s.status === "rejected");
  return {
    submissions: {
      pending,
      published,
      rejected,
      all: submissions
    },
    shop: session.shop
  };
}
const meta = () => [
  { title: "Story Submissions | Admin Dashboard" }
];
function SubmissionCard({ submission, status }) {
  const statusColor = {
    pending: "#f59e0b",
    published: "#10b981",
    rejected: "#e53e3e"
  };
  return /* @__PURE__ */ jsxs("div", { className: styles.submissionCard, children: [
    /* @__PURE__ */ jsxs("div", { className: styles.cardHeader, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h4", { className: styles.submitterName, children: [
          submission.firstName,
          " ",
          submission.lastName
        ] }),
        /* @__PURE__ */ jsx("p", { className: styles.submitterEmail, children: submission.email })
      ] }),
      /* @__PURE__ */ jsx(
        "span",
        {
          className: styles.statusBadge,
          style: { backgroundColor: statusColor[submission.status] },
          children: submission.status.charAt(0).toUpperCase() + submission.status.slice(1)
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: styles.cardContent, children: [
      /* @__PURE__ */ jsxs("p", { className: styles.category, children: [
        /* @__PURE__ */ jsx("strong", { children: "Category:" }),
        " ",
        submission.category
      ] }),
      /* @__PURE__ */ jsxs("p", { className: styles.location, children: [
        /* @__PURE__ */ jsx("strong", { children: "Location:" }),
        " ",
        submission.location
      ] }),
      /* @__PURE__ */ jsxs("p", { className: styles.date, children: [
        /* @__PURE__ */ jsx("strong", { children: "Date:" }),
        " ",
        submission.date
      ] }),
      /* @__PURE__ */ jsxs("div", { className: styles.storyPreview, children: [
        /* @__PURE__ */ jsx("p", { className: styles.previewLabel, children: "Story Preview:" }),
        /* @__PURE__ */ jsxs("p", { className: styles.previewText, children: [
          submission.details.substring(0, 200),
          "..."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: styles.metadata, children: [
        /* @__PURE__ */ jsxs("span", { className: styles.metaItem, children: [
          "📻 ",
          submission.podcastContact ? "Wants podcast contact" : "No podcast contact"
        ] }),
        submission.imageUrls && submission.imageUrls.length > 0 && /* @__PURE__ */ jsxs("span", { className: styles.metaItem, children: [
          "📷 ",
          submission.imageUrls.length,
          " image",
          submission.imageUrls.length > 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: styles.timestamps, children: [
        /* @__PURE__ */ jsxs("p", { className: styles.timestamp, children: [
          "Submitted: ",
          new Date(submission.createdAt).toLocaleDateString(),
          " at",
          " ",
          new Date(submission.createdAt).toLocaleTimeString()
        ] }),
        submission.publishedAt && /* @__PURE__ */ jsxs("p", { className: styles.timestamp, children: [
          "Published: ",
          new Date(submission.publishedAt).toLocaleDateString()
        ] })
      ] }),
      submission.blogPostUrl && /* @__PURE__ */ jsx(
        "a",
        {
          href: `https://${submission.blogPostUrl}`,
          target: "_blank",
          rel: "noopener noreferrer",
          className: styles.viewButton,
          children: "View in Shopify Admin"
        }
      ),
      submission.adminNotes && /* @__PURE__ */ jsxs("div", { className: styles.adminNotes, children: [
        /* @__PURE__ */ jsx("p", { className: styles.notesLabel, children: "Admin Notes:" }),
        /* @__PURE__ */ jsx("p", { className: styles.notesText, children: submission.adminNotes })
      ] })
    ] })
  ] });
}
function SubmissionList({ title, submissions, status }) {
  if (submissions.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: styles.section, children: [
      /* @__PURE__ */ jsx("h3", { className: styles.sectionTitle, children: title }),
      /* @__PURE__ */ jsxs("p", { className: styles.emptyMessage, children: [
        "No ",
        status,
        " submissions yet."
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: styles.section, children: [
    /* @__PURE__ */ jsxs("h3", { className: styles.sectionTitle, children: [
      title,
      " ",
      /* @__PURE__ */ jsx("span", { className: styles.count, children: submissions.length })
    ] }),
    /* @__PURE__ */ jsx("div", { className: styles.submissionsList, children: submissions.map((submission) => /* @__PURE__ */ jsx(SubmissionCard, { submission, status }, submission.id)) })
  ] });
}
function SubmissionsPage() {
  const { submissions } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: styles.container, children: [
    /* @__PURE__ */ jsxs("header", { className: styles.header, children: [
      /* @__PURE__ */ jsx("h1", { className: styles.pageTitle, children: "Story Submissions" }),
      /* @__PURE__ */ jsx("p", { className: styles.pageSubtitle, children: "Manage story submissions from your storefront. Submissions appear as draft blog posts in your Shopify admin." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: styles.stats, children: [
      /* @__PURE__ */ jsxs("div", { className: styles.statCard, children: [
        /* @__PURE__ */ jsx("p", { className: styles.statLabel, children: "Total Submissions" }),
        /* @__PURE__ */ jsx("p", { className: styles.statNumber, children: submissions.all.length })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: styles.statCard, children: [
        /* @__PURE__ */ jsx("p", { className: styles.statLabel, children: "Pending Review" }),
        /* @__PURE__ */ jsx("p", { className: styles.statNumber, children: submissions.pending.length })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: styles.statCard, children: [
        /* @__PURE__ */ jsx("p", { className: styles.statLabel, children: "Published" }),
        /* @__PURE__ */ jsx("p", { className: styles.statNumber, children: submissions.published.length })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: styles.statCard, children: [
        /* @__PURE__ */ jsx("p", { className: styles.statLabel, children: "Rejected" }),
        /* @__PURE__ */ jsx("p", { className: styles.statNumber, children: submissions.rejected.length })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      SubmissionList,
      {
        title: "Pending Review",
        submissions: submissions.pending,
        status: "pending"
      }
    ),
    /* @__PURE__ */ jsx(
      SubmissionList,
      {
        title: "Published Stories",
        submissions: submissions.published,
        status: "published"
      }
    ),
    /* @__PURE__ */ jsx(
      SubmissionList,
      {
        title: "Rejected Stories",
        submissions: submissions.rejected,
        status: "rejected"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: styles.instructions, children: [
      /* @__PURE__ */ jsx("h3", { className: styles.instructionsTitle, children: "How It Works" }),
      /* @__PURE__ */ jsxs("ol", { className: styles.instructionsList, children: [
        /* @__PURE__ */ jsx("li", { children: "Customers submit stories through your storefront form" }),
        /* @__PURE__ */ jsx("li", { children: "Submissions are created as draft blog posts in your Shopify Admin" }),
        /* @__PURE__ */ jsx("li", { children: "You review and approve/reject the posts in Shopify Content → Blog Posts" }),
        /* @__PURE__ */ jsx("li", { children: "Published posts appear in your Community Stories section" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: styles.instructionsNote, children: [
        "📝 To manage submissions, go to ",
        /* @__PURE__ */ jsx("strong", { children: "Content → Blog Posts" }),
        ' in your Shopify Admin. Look for blog posts tagged with "Community Story".'
      ] })
    ] })
  ] });
}
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: SubmissionsPage,
  loader: loader$1,
  meta
}, Symbol.toStringTag, { value: "Module" }));
function AdditionalPage() {
  return /* @__PURE__ */ jsxs(Page, { children: [
    /* @__PURE__ */ jsx(TitleBar, { title: "Additional page" }),
    /* @__PURE__ */ jsxs(Layout, { children: [
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodyMd", children: [
          "The app template comes with an additional page which demonstrates how to create multiple pages within app navigation using",
          " ",
          /* @__PURE__ */ jsx(
            Link$1,
            {
              url: "https://shopify.dev/docs/apps/tools/app-bridge",
              target: "_blank",
              removeUnderline: true,
              children: "App Bridge"
            }
          ),
          "."
        ] }),
        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodyMd", children: [
          "To create your own page and have it show up in the app navigation, add a page inside ",
          /* @__PURE__ */ jsx(Code, { children: "app/routes" }),
          ", and a link to it in the ",
          /* @__PURE__ */ jsx(Code, { children: "<NavMenu>" }),
          " component found in ",
          /* @__PURE__ */ jsx(Code, { children: "app/routes/app.jsx" }),
          "."
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Resources" }),
        /* @__PURE__ */ jsx(List, { children: /* @__PURE__ */ jsx(List.Item, { children: /* @__PURE__ */ jsx(
          Link$1,
          {
            url: "https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav",
            target: "_blank",
            removeUnderline: true,
            children: "App nav best practices"
          }
        ) }) })
      ] }) }) })
    ] })
  ] });
}
function Code({ children }) {
  return /* @__PURE__ */ jsx(
    Box,
    {
      as: "span",
      padding: "025",
      paddingInlineStart: "100",
      paddingInlineEnd: "100",
      background: "bg-surface-active",
      borderWidth: "025",
      borderColor: "border",
      borderRadius: "100",
      children: /* @__PURE__ */ jsx("code", { children })
    }
  );
}
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: AdditionalPage
}, Symbol.toStringTag, { value: "Module" }));
const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
function Index() {
  var _a2;
  const setupFetcher = useFetcher();
  const shopify2 = useAppBridge();
  const navigate = useNavigate();
  const [setupComplete, setSetupComplete] = useState(false);
  const isSettingUp = setupFetcher.state === "submitting" || setupFetcher.state === "loading";
  useEffect(() => {
    var _a3, _b;
    if ((_a3 = setupFetcher.data) == null ? void 0 : _a3.success) {
      shopify2.toast.show(setupFetcher.data.message);
      if (!setupFetcher.data.alreadyExists) {
        setSetupComplete(true);
      }
    } else if (((_b = setupFetcher.data) == null ? void 0 : _b.success) === false) {
      shopify2.toast.show("Setup failed: " + (setupFetcher.data.error || "Unknown error"), {
        isError: true
      });
    }
  }, [setupFetcher.data, shopify2]);
  const runSetup = () => {
    setupFetcher.submit({}, {
      method: "POST",
      action: "/app/setup-metaobject"
    });
  };
  const goToSubmissions = () => {
    navigate("/app/submissions");
  };
  return /* @__PURE__ */ jsxs(Page, { children: [
    /* @__PURE__ */ jsx(TitleBar, { title: "Story App - Dashboard" }),
    /* @__PURE__ */ jsx(BlockStack, { gap: "500", children: /* @__PURE__ */ jsxs(Layout, { children: [
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Welcome to Story App" }),
          /* @__PURE__ */ jsx(Text, { variant: "bodyMd", as: "p", children: "This app allows your customers to submit memorial stories that can be displayed on your storefront. Stories are stored as Shopify metaobjects for seamless integration with your theme." })
        ] }),
        setupComplete && /* @__PURE__ */ jsx(Banner, { tone: "success", children: /* @__PURE__ */ jsx("p", { children: "Metaobject definition created successfully! You can now start accepting story submissions." }) }),
        /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
          /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Quick Start" }),
          /* @__PURE__ */ jsxs(List, { type: "number", children: [
            /* @__PURE__ */ jsx(List.Item, { children: "Run the initial setup to create the Story metaobject definition (one-time only)" }),
            /* @__PURE__ */ jsx(List.Item, { children: "Share your public submission form with customers" }),
            /* @__PURE__ */ jsx(List.Item, { children: "Review and approve submissions in the Submissions page" }),
            /* @__PURE__ */ jsx(List.Item, { children: "Published stories appear as metaobjects in your Shopify admin" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(InlineStack, { gap: "300", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "primary",
              loading: isSettingUp,
              onClick: runSetup,
              children: "Run Initial Setup"
            }
          ),
          /* @__PURE__ */ jsx(Button, { onClick: goToSubmissions, children: "View Submissions" })
        ] }),
        ((_a2 = setupFetcher.data) == null ? void 0 : _a2.definition) && /* @__PURE__ */ jsx(Banner, { tone: "info", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodyMd", children: [
            /* @__PURE__ */ jsx("strong", { children: "Metaobject Definition:" }),
            " ",
            setupFetcher.data.definition.name,
            " (",
            setupFetcher.data.definition.type,
            ")"
          ] }),
          setupFetcher.data.alreadyExists && /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "The metaobject definition already exists - no action needed!" })
        ] }) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Features" }),
          /* @__PURE__ */ jsxs(List, { children: [
            /* @__PURE__ */ jsx(List.Item, { children: "Public story submission form" }),
            /* @__PURE__ */ jsx(List.Item, { children: "Admin submission review dashboard" }),
            /* @__PURE__ */ jsx(List.Item, { children: "Photo upload support" }),
            /* @__PURE__ */ jsx(List.Item, { children: "Shopify metaobject integration" }),
            /* @__PURE__ */ jsx(List.Item, { children: "GDPR compliant data handling" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Public URLs" }),
          /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: /* @__PURE__ */ jsx("strong", { children: "Submission Form:" }) }),
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "/stories (public memorial wall + form)" }),
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "/submit-story (standalone form)" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Resources" }),
          /* @__PURE__ */ jsxs(List, { children: [
            /* @__PURE__ */ jsx(List.Item, { children: "View DEPLOYMENT_GUIDE.md for production setup" }),
            /* @__PURE__ */ jsx(List.Item, { children: "Check APP_CONFIG_INFO.md for configuration details" }),
            /* @__PURE__ */ jsx(List.Item, { children: "Privacy Policy and Terms of Service are available at /privacy-policy and /terms-of-service" })
          ] })
        ] }) })
      ] }) })
    ] }) })
  ] });
}
const route20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BqzGMcYv.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/index-BPQRexiR.js", "/assets/components-DpadYxWV.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-DAw1dgfK.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/index-BPQRexiR.js", "/assets/components-DpadYxWV.js"], "css": [] }, "routes/webhooks.customers.data_request": { "id": "routes/webhooks.customers.data_request", "parentId": "root", "path": "webhooks/customers/data_request", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.customers.data_request-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/webhooks.app.scopes_update": { "id": "routes/webhooks.app.scopes_update", "parentId": "root", "path": "webhooks/app/scopes_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.scopes_update-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/webhooks.customers.redact": { "id": "routes/webhooks.customers.redact", "parentId": "root", "path": "webhooks/customers/redact", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.customers.redact-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "root", "path": "webhooks/app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/webhooks.shop.redact": { "id": "routes/webhooks.shop.redact", "parentId": "root", "path": "webhooks/shop/redact", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.shop.redact-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/submit-story._index": { "id": "routes/submit-story._index", "parentId": "root", "path": "submit-story", "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-DQUa9w_x.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/index-BPQRexiR.js", "/assets/StorySubmissionForm-B0jHB7b_.js", "/assets/components-DpadYxWV.js"], "css": ["/assets/route-z2LFSwkq.css", "/assets/StorySubmissionForm-C2gH0_-y.css"] }, "routes/admin.submissions": { "id": "routes/admin.submissions", "parentId": "root", "path": "admin/submissions", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-Cy5FNNwv.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/index-BPQRexiR.js", "/assets/components-DpadYxWV.js"], "css": [] }, "routes/terms-of-service": { "id": "routes/terms-of-service", "parentId": "root", "path": "terms-of-service", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-BeHj1dK0.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js"], "css": [] }, "routes/privacy-policy": { "id": "routes/privacy-policy", "parentId": "root", "path": "privacy-policy", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-DNpBEOy0.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js"], "css": [] }, "routes/stories._index": { "id": "routes/stories._index", "parentId": "root", "path": "stories", "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-gjcYHod5.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/index-BPQRexiR.js", "/assets/StorySubmissionForm-B0jHB7b_.js", "/assets/components-DpadYxWV.js"], "css": ["/assets/route-kIMFYH3i.css", "/assets/StorySubmissionForm-C2gH0_-y.css"] }, "routes/stories.$id": { "id": "routes/stories.$id", "parentId": "root", "path": "stories/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-CL3KUhut.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/index-BPQRexiR.js", "/assets/components-DpadYxWV.js"], "css": ["/assets/route-ITGJU6pA.css"] }, "routes/auth.login": { "id": "routes/auth.login", "parentId": "root", "path": "auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-BjJV5UW2.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/index-BPQRexiR.js", "/assets/styles-6TauYsLP.js", "/assets/components-DpadYxWV.js", "/assets/Page-D8WNDyj0.js", "/assets/context-C5qbiZyd.js"], "css": [] }, "routes/healthz": { "id": "routes/healthz", "parentId": "root", "path": "healthz", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/healthz-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-CGQNBb8l.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/components-DpadYxWV.js", "/assets/index-BPQRexiR.js"], "css": ["/assets/route-BxcW7S-3.css"] }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/app-BEQAvO5E.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/index-BPQRexiR.js", "/assets/components-DpadYxWV.js", "/assets/styles-6TauYsLP.js", "/assets/context-C5qbiZyd.js"], "css": [] }, "routes/app.setup-metaobject": { "id": "routes/app.setup-metaobject", "parentId": "routes/app", "path": "setup-metaobject", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.setup-metaobject-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app.submissions": { "id": "routes/app.submissions", "parentId": "routes/app", "path": "submissions", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-DLgdFWzD.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/components-DpadYxWV.js", "/assets/index-BPQRexiR.js"], "css": ["/assets/route-CJu1wfEz.css"] }, "routes/app.additional": { "id": "routes/app.additional", "parentId": "routes/app", "path": "additional", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.additional-BcfL_rDs.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/Page-D8WNDyj0.js", "/assets/TitleBar-DSzr8Q50.js", "/assets/index-BPQRexiR.js", "/assets/context-C5qbiZyd.js"], "css": [] }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app._index-y0VjC43Z.js", "imports": ["/assets/jsx-runtime-Z8WwdQU7.js", "/assets/index-BPQRexiR.js", "/assets/components-DpadYxWV.js", "/assets/Page-D8WNDyj0.js", "/assets/TitleBar-DSzr8Q50.js", "/assets/context-C5qbiZyd.js"], "css": [] } }, "url": "/assets/manifest-4b9af967.js", "version": "4b9af967" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": true, "v3_singleFetch": false, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/webhooks.customers.data_request": {
    id: "routes/webhooks.customers.data_request",
    parentId: "root",
    path: "webhooks/customers/data_request",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "root",
    path: "webhooks/app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/webhooks.customers.redact": {
    id: "routes/webhooks.customers.redact",
    parentId: "root",
    path: "webhooks/customers/redact",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/webhooks.shop.redact": {
    id: "routes/webhooks.shop.redact",
    parentId: "root",
    path: "webhooks/shop/redact",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/submit-story._index": {
    id: "routes/submit-story._index",
    parentId: "root",
    path: "submit-story",
    index: true,
    caseSensitive: void 0,
    module: route6
  },
  "routes/admin.submissions": {
    id: "routes/admin.submissions",
    parentId: "root",
    path: "admin/submissions",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/terms-of-service": {
    id: "routes/terms-of-service",
    parentId: "root",
    path: "terms-of-service",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/privacy-policy": {
    id: "routes/privacy-policy",
    parentId: "root",
    path: "privacy-policy",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/stories._index": {
    id: "routes/stories._index",
    parentId: "root",
    path: "stories",
    index: true,
    caseSensitive: void 0,
    module: route10
  },
  "routes/stories.$id": {
    id: "routes/stories.$id",
    parentId: "root",
    path: "stories/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/healthz": {
    id: "routes/healthz",
    parentId: "root",
    path: "healthz",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route15
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/app.setup-metaobject": {
    id: "routes/app.setup-metaobject",
    parentId: "routes/app",
    path: "setup-metaobject",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/app.submissions": {
    id: "routes/app.submissions",
    parentId: "routes/app",
    path: "submissions",
    index: void 0,
    caseSensitive: void 0,
    module: route18
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route20
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
