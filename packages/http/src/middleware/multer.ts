"use strict";

/*!
 * multer
 * Copyright(c) 2014 Hage Yaapa
 * Copyright(c) 2015 Fangdun Cai
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import originalMulter from "multer";

declare module "koa" {
  interface Request {
    body?: any;
    rawBody: string;
    file?: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      destination: string;
      filename: string;
      path: string;
      size: number;
    };
  }
}

function multer(options) {
  const m = originalMulter(options);

  makePromise(m, "any");
  makePromise(m, "array");
  makePromise(m, "fields");
  makePromise(m, "none");
  makePromise(m, "single");

  return m;
}

function makePromise(multer, name) {
  if (!multer[name]) return;

  const fn = multer[name];

  multer[name] = function () {
    // eslint-disable-next-line prefer-rest-params
    const middleware = Reflect.apply(fn, this, arguments);

    return async (ctx, next) => {
      await new Promise((resolve, reject) => {
        middleware(ctx.req, ctx.res, (err) => {
          if (err) return reject(err);
          if ("request" in ctx) {
            if (ctx.req.body) {
              ctx.request.body = ctx.req.body;
              delete ctx.req.body;
            }

            if (ctx.req.file) {
              ctx.request.file = ctx.req.file;
              ctx.file = ctx.req.file;
              delete ctx.req.file;
            }

            if (ctx.req.files) {
              ctx.request.files = ctx.req.files;
              ctx.files = ctx.req.files;
              delete ctx.req.files;
            }
          }

          resolve(ctx);
        });
      });

      return next();
    };
  };
}

multer.diskStorage = originalMulter.diskStorage;
multer.memoryStorage = originalMulter.memoryStorage;

export default multer;
